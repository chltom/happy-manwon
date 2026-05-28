import { describe, it, expect } from "vitest"
import { recommend } from "./recommend"
import type { Restaurant, VisitRecord } from "@/types/restaurant"

const makeMenu = (price: number) => ({ id: "m1", name: "메뉴", price })

const makeRestaurant = (id: string, menus: { price: number }[] = []): Restaurant => ({
  id,
  name: `식당 ${id}`,
  category: "한식",
  address: "서울",
  menus: menus.map((m, i) => ({ id: `${id}-m${i}`, name: `메뉴${i}`, price: m.price })),
  createdAt: Date.now(),
})

const today = "2026-05-28"
const visit = (restaurantId: string, daysAgo: number): VisitRecord => {
  const d = new Date("2026-05-28")
  d.setDate(d.getDate() - daysAgo)
  return { restaurantId, date: d.toISOString().slice(0, 10) }
}

describe("recommend", () => {
  it("식당 0개 → 빈 배열 반환", () => {
    expect(recommend([], [], today)).toEqual([])
  })

  it("1만원 이하 메뉴가 없는 식당 → 결과에서 제외", () => {
    const r = makeRestaurant("a", [{ price: 12000 }])
    expect(recommend([r], [], today)).toEqual([])
  })

  it("메뉴가 0개인 식당 → 결과에서 제외", () => {
    const r = makeRestaurant("a", [])
    expect(recommend([r], [], today)).toEqual([])
  })

  it("1만원 이하 메뉴 보유 식당 → 결과에 포함", () => {
    const r = makeRestaurant("a", [{ price: 9000 }])
    expect(recommend([r], [], today).map((x) => x.id)).toEqual(["a"])
  })

  it("3일 이내 방문 식당 → 미방문 식당이 있으면 정상 후보에서 제외", () => {
    const recent = makeRestaurant("a", [{ price: 8000 }])
    const fresh = makeRestaurant("b", [{ price: 9000 }])
    const visits = [visit("a", 1)]
    const result = recommend([recent, fresh], visits, today)
    expect(result.map((x) => x.id)).not.toContain("a")
    expect(result.map((x) => x.id)).toContain("b")
  })

  it("3일 초과 방문 식당 → 정상 후보에 포함", () => {
    const r = makeRestaurant("a", [{ price: 8000 }])
    const visits = [visit("a", 4)]
    expect(recommend([r], visits, today).map((x) => x.id)).toEqual(["a"])
  })

  it("정상 후보 0개 → 방문일 오래된 순으로 반환 (폴백)", () => {
    const r1 = makeRestaurant("a", [{ price: 8000 }])
    const r2 = makeRestaurant("b", [{ price: 9000 }])
    const visits = [visit("a", 2), visit("b", 1)]
    const result = recommend([r1, r2], visits, today)
    expect(result.map((x) => x.id)).toEqual(["a", "b"])
  })

  it("최대 3개까지만 반환", () => {
    const restaurants = ["a", "b", "c", "d"].map((id) =>
      makeRestaurant(id, [{ price: 8000 }])
    )
    expect(recommend(restaurants, [], today).length).toBe(3)
  })
})
