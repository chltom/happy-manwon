import type { Restaurant, VisitRecord } from "@/types/restaurant"

const RESTAURANTS_KEY = "lf_restaurants"
const VISITS_KEY = "lf_visits"

export function loadRestaurants(): Restaurant[] {
  try {
    const raw = localStorage.getItem(RESTAURANTS_KEY)
    return raw ? (JSON.parse(raw) as Restaurant[]) : []
  } catch {
    return []
  }
}

export function saveRestaurants(restaurants: Restaurant[]): void {
  localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(restaurants))
  window.dispatchEvent(new CustomEvent("restaurants-updated"))
}

export function loadVisits(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY)
    return raw ? (JSON.parse(raw) as VisitRecord[]) : []
  } catch {
    return []
  }
}

export function saveVisits(visits: VisitRecord[]): void {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
}
