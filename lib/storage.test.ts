import { describe, it, expect, beforeEach } from "vitest"
import { loadRestaurants, saveRestaurants, loadVisits, saveVisits } from "./storage"
import type { Restaurant, VisitRecord } from "@/types/restaurant"

beforeEach(() => {
  localStorage.clear()
})

const makeRestaurant = (overrides?: Partial<Restaurant>): Restaurant => ({
  id: "r1",
  name: "청국장 마을",
  category: "한식",
  address: "서울시 강남구 역삼동 123",
  menus: [],
  createdAt: 1716854400000,
  ...overrides,
})

describe("loadRestaurants", () => {
  it("저장된 적 없으면 빈 배열 반환", () => {
    expect(loadRestaurants()).toEqual([])
  })
})

describe("saveRestaurants + loadRestaurants", () => {
  it("저장 후 재호출 시 동일 배열 반환", () => {
    const r = makeRestaurant()
    saveRestaurants([r])
    expect(loadRestaurants()).toEqual([r])
  })

  it("빈 배열 저장 후 빈 배열 반환", () => {
    saveRestaurants([makeRestaurant()])
    saveRestaurants([])
    expect(loadRestaurants()).toEqual([])
  })
})

describe("loadVisits", () => {
  it("저장된 적 없으면 빈 배열 반환", () => {
    expect(loadVisits()).toEqual([])
  })
})

describe("saveVisits + loadVisits", () => {
  it("저장 후 재호출 시 동일 배열 반환", () => {
    const v: VisitRecord = { restaurantId: "r1", date: "2026-05-28" }
    saveVisits([v])
    expect(loadVisits()).toEqual([v])
  })
})
