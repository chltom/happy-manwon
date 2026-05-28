"use client"

import { useState, useMemo } from "react"
import { Wand2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useRestaurants } from "@/hooks/use-restaurants"

type Status = "idle" | "crawling" | "done" | "error"

export function MenuCrawlButton() {
  const { restaurants, batchUpdateMenus } = useRestaurants()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [errorMsg, setErrorMsg] = useState("")

  const crawlable = useMemo(
    () => restaurants.filter((r) => r.kakaoId),
    [restaurants]
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(crawlable.filter((r) => r.menus.length === 0).map((r) => r.id))
  )

  if (crawlable.length === 0) return null

  const allSelected = crawlable.every((r) => selectedIds.has(r.id))
  const noneSelected = selectedIds.size === 0
  const isLoading = status === "crawling"

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(crawlable.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCrawl() {
    if (noneSelected) return

    const targets = crawlable.filter((r) => selectedIds.has(r.id))

    setStatus("crawling")
    setProgress({ done: 0, total: targets.length })
    setErrorMsg("")

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

  return (
    <div className="flex flex-col gap-1 border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Wand2 className="size-4 text-muted-foreground" />
          메뉴 자동 채우기
        </span>
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t px-3 pb-3 pt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="전체 선택"
              />
              전체 선택
            </label>
            <span className="text-xs text-muted-foreground">{selectedIds.size}/{crawlable.length}개 선택</span>
          </div>

          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {crawlable.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 py-1 text-sm cursor-pointer select-none"
              >
                <Checkbox
                  checked={selectedIds.has(r.id)}
                  onCheckedChange={() => toggleOne(r.id)}
                  aria-label={r.name}
                />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.menus.length > 0 ? `메뉴 ${r.menus.length}개` : "미등록"}
                </span>
              </label>
            ))}
          </div>

          <Button
            onClick={handleCrawl}
            disabled={isLoading || noneSelected}
            size="sm"
            className="w-full mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                크롤링 중... ({progress.done}/{progress.total})
              </>
            ) : (
              <>
                <Wand2 className="size-4 mr-2" />
                선택한 {selectedIds.size}개 크롤링
              </>
            )}
          </Button>

          {status === "done" && (
            <p className="text-xs text-muted-foreground">
              크롤링 완료 · 메뉴 없는 식당은 카카오에 등록되지 않은 경우입니다
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-destructive">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  )
}
