"use client"

import { useState } from "react"
import { Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRestaurants } from "@/hooks/use-restaurants"

type Status = "idle" | "crawling" | "done" | "error"

export function MenuCrawlButton() {
  const { restaurants, batchUpdateMenus } = useRestaurants()
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState("")

  const targets = restaurants.filter((r) => r.kakaoId && r.menus.length === 0)

  async function handleCrawl() {
    if (targets.length === 0) return

    setStatus("crawling")
    setProgress({ done: 0, total: targets.length })
    setErrorMsg("")

    // 한 번에 최대 5개씩 배치 처리
    const BATCH = 5
    const allUpdates: { id: string; menus: { id: string; name: string; price: number }[] }[] = []

    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH)
      try {
        const res = await fetch("/api/crawl-menus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targets: batch.map((r) => ({ id: r.id, kakaoId: r.kakaoId })),
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setErrorMsg(data.error ?? "크롤링에 실패했습니다")
          setStatus("error")
          return
        }

        const data = await res.json()
        // API는 restaurantId로 반환 → batchUpdateMenus가 기대하는 id로 변환
        allUpdates.push(
          ...(data.results ?? []).map((r: { restaurantId: string; menus: typeof allUpdates[0]["menus"] }) => ({
            id: r.restaurantId,
            menus: r.menus,
          }))
        )
      } catch {
        setErrorMsg("크롤링 요청에 실패했습니다")
        setStatus("error")
        return
      }

      setProgress({ done: Math.min(i + BATCH, targets.length), total: targets.length })
    }

    const validUpdates = allUpdates.filter((u) => u.menus.length > 0)
    if (validUpdates.length > 0) {
      batchUpdateMenus(validUpdates)
    }

    setStatus("done")
    setProgress({ done: targets.length, total: targets.length })
  }

  if (targets.length === 0) return null

  const isLoading = status === "crawling"

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        onClick={handleCrawl}
        disabled={isLoading}
        className="w-full justify-start gap-2"
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
        {isLoading
          ? `메뉴 크롤링 중... (${progress.done}/${progress.total})`
          : `메뉴 자동 채우기 (${targets.length}개 식당)`}
      </Button>
      {status === "done" && (
        <p className="text-xs text-muted-foreground px-1">
          크롤링 완료 · 메뉴 없는 식당은 카카오에 등록되지 않은 경우입니다
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive px-1">{errorMsg}</p>
      )}
    </div>
  )
}
