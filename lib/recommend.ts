import type { Restaurant, VisitRecord } from "@/types/restaurant"

export const RECENT_DAYS = 3
export const MAX_RESULTS = 3
export const PRICE_LIMIT = 10000

function hasAffordableMenu(r: Restaurant): boolean {
  return r.menus.length > 0 && r.menus.some((m) => m.price <= PRICE_LIMIT)
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)
  )
}

function lastVisitDate(restaurantId: string, visits: VisitRecord[]): string | null {
  const dates = visits
    .filter((v) => v.restaurantId === restaurantId)
    .map((v) => v.date)
    .sort()
    .reverse()
  return dates[0] ?? null
}

export function isRecommendFallback(
  restaurants: Restaurant[],
  visits: VisitRecord[],
  today: string
): boolean {
  const eligible = restaurants.filter(hasAffordableMenu)
  if (eligible.length === 0) return false
  const normal = eligible.filter((r) => {
    const last = lastVisitDate(r.id, visits)
    return last === null || daysBetween(last, today) > RECENT_DAYS
  })
  return normal.length === 0
}

export function recommend(
  restaurants: Restaurant[],
  visits: VisitRecord[],
  today: string
): Restaurant[] {
  const eligible = restaurants.filter(hasAffordableMenu)
  if (eligible.length === 0) return []

  const normal = eligible.filter((r) => {
    const last = lastVisitDate(r.id, visits)
    return last === null || daysBetween(last, today) > RECENT_DAYS
  })

  if (normal.length > 0) {
    return normal.slice(0, MAX_RESULTS)
  }

  // 폴백: 방문일 오래된 순
  return eligible
    .slice()
    .sort((a, b) => {
      const la = lastVisitDate(a.id, visits) ?? "0000-00-00"
      const lb = lastVisitDate(b.id, visits) ?? "0000-00-00"
      return la < lb ? -1 : la > lb ? 1 : 0
    })
    .slice(0, MAX_RESULTS)
}
