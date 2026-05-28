"use client"

import { useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRestaurants } from "@/hooks/use-restaurants"

type Status = "idle" | "locating" | "fetching" | "done" | "error"

interface ImportResult {
  added: number
  skipped: number
}

interface NearbyRestaurantImportProps {
  onDone?: () => void
}

export function NearbyRestaurantImport({ onDone }: NearbyRestaurantImportProps) {
  const { restaurants, add } = useRestaurants()
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleImport() {
    setStatus("locating")
    setResult(null)
    setErrorMsg("")

    let coords: { lat: number; lng: number }
    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          reject,
          { timeout: 10000 }
        )
      })
    } catch {
      setStatus("error")
      setErrorMsg("위치 권한이 필요합니다")
      return
    }

    setStatus("fetching")
    try {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      })
      const res = await fetch(`/api/kakao-nearby?${params}`)
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()

      const existing = new Set(restaurants.map((r) => `${r.name}|${r.address}`))
      let added = 0
      let skipped = 0

      for (const place of data.places ?? []) {
        const key = `${place.name}|${place.address}`
        if (existing.has(key)) {
          skipped++
        } else {
          add({
            name: place.name,
            address: place.address,
            category: place.category,
            menus: [],
            lat: place.lat,
            lng: place.lng,
          })
          existing.add(key)
          added++
        }
      }

      setResult({ added, skipped })
      setStatus("done")
      onDone?.()
    } catch {
      setStatus("error")
      setErrorMsg("식당 탐색에 실패했습니다")
    }
  }

  const isLoading = status === "locating" || status === "fetching"

  const buttonLabel =
    status === "locating"
      ? "위치 확인 중..."
      : status === "fetching"
        ? "주변 식당 탐색 중..."
        : "주변 2km 식당 자동 추가"

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        onClick={handleImport}
        disabled={isLoading}
        className="w-full justify-start gap-2"
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
        {buttonLabel}
      </Button>
      {status === "done" && result && (
        <p className="text-xs text-muted-foreground px-1">
          {result.added}개 추가됨
          {result.skipped > 0 ? ` · ${result.skipped}개 중복 건너뜀` : ""}
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive px-1">{errorMsg}</p>
      )}
    </div>
  )
}
