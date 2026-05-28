"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RefreshCw, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadRestaurants, loadVisits } from "@/lib/storage"
import { recommend, isRecommendFallback, daysBetween } from "@/lib/recommend"
import type { Restaurant, VisitRecord } from "@/types/restaurant"
import { RestaurantCard } from "./restaurant-card"

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function computeBatch(
  restaurants: Restaurant[],
  visits: VisitRecord[],
  shownIds: Set<string>,
  today: string
): { batch: Restaurant[]; isFallback: boolean } {
  const available = restaurants.filter((r) => !shownIds.has(r.id))
  const source = available.length > 0 ? available : restaurants
  return {
    batch: recommend(source, visits, today),
    isFallback: isRecommendFallback(source, visits, today),
  }
}

export function RecommendationScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [shownIds, setShownIds] = useState<Set<string>>(new Set())
  const [batch, setBatch] = useState<Restaurant[]>([])
  const [isFallback, setIsFallback] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const r = loadRestaurants()
    const v = loadVisits()
    const today = getToday()
    const { batch: initialBatch, isFallback: fb } = computeBatch(r, v, new Set(), today)
    setRestaurants(r)
    setVisits(v)
    setBatch(initialBatch)
    setIsFallback(fb)
    setLoaded(true)
  }, [])

  function handleNextRecommendation() {
    const today = getToday()
    const newShown = new Set([...shownIds, ...batch.map((r) => r.id)])
    const { batch: nextBatch, isFallback: fb } = computeBatch(restaurants, visits, newShown, today)
    setShownIds(newShown)
    setBatch(nextBatch)
    setIsFallback(fb)
  }

  const today = getToday()

  if (!loaded) return null

  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center py-16 gap-4">
        <Utensils className="size-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">아직 등록된 식당이 없어요</p>
          <p className="text-xs text-muted-foreground mt-1">
            주변 식당을 추가해 추천을 받아보세요
          </p>
        </div>
        <Button asChild>
          <Link href="/restaurants/add">식당 추가하기</Link>
        </Button>
      </div>
    )
  }

  if (batch.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center py-16 gap-4">
        <Utensils className="size-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">추천 가능한 식당이 없어요</p>
          <p className="text-xs text-muted-foreground mt-1">
            1만원 이하 메뉴가 있는 식당을 추가해 보세요
          </p>
        </div>
        <Button asChild>
          <Link href="/restaurants/add">식당 추가하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-bold text-base">오늘 점심</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(today).toLocaleDateString("ko-KR", { weekday: "short", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNextRecommendation} className="flex gap-1.5">
          <RefreshCw className="size-3" />
          다음 추천
        </Button>
      </div>

      {isFallback && (
        <div className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 mb-4 text-xs text-muted-foreground">
          <span>최근 방문한 곳만 있어요. 가장 오래된 순으로 보여드립니다.</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {batch.map((r) => {
          const lastVisit = visits
            .filter((v) => v.restaurantId === r.id)
            .map((v) => v.date)
            .sort()
            .reverse()[0]
          return (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              dimmed={isFallback}
              visitedLabel={isFallback && lastVisit ? `${Math.round(daysBetween(lastVisit, today))}일 전 방문` : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
