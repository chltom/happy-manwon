import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { RecommendationScreen } from "./recommendation-screen"
import * as storage from "@/lib/storage"
import type { Restaurant, VisitRecord } from "@/types/restaurant"

vi.mock("@/lib/storage")
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const today = new Date().toISOString().slice(0, 10)

function makeRestaurant(id: string, menus: { name: string; price: number }[]): Restaurant {
  return {
    id,
    name: `식당 ${id}`,
    category: "한식",
    address: "서울",
    menus: menus.map((m, i) => ({ id: `${id}-m${i}`, name: m.name, price: m.price })),
    createdAt: Date.now(),
  }
}

function visitedDaysAgo(restaurantId: string, days: number): VisitRecord {
  const d = new Date(today)
  d.setDate(d.getDate() - days)
  return { restaurantId, date: d.toISOString().slice(0, 10) }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(storage.loadRestaurants).mockReturnValue([])
  vi.mocked(storage.loadVisits).mockReturnValue([])
})

describe("RecommendationScreen", () => {
  it("등록 식당 0개 → '아직 등록된 식당이 없어요' + 추가 버튼", async () => {
    render(<RecommendationScreen />)
    expect(await screen.findByText(/아직 등록된 식당이 없어요/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /식당 추가/i })).toBeInTheDocument()
  })

  it("1만원 이하 메뉴 보유 식당 3개 → 카드 3개, 이름·카테고리·메뉴명·가격 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("a", [{ name: "된장찌개", price: 8500 }]),
      makeRestaurant("b", [{ name: "비빔밥", price: 9000 }]),
      makeRestaurant("c", [{ name: "순대국", price: 9500 }]),
    ])
    render(<RecommendationScreen />)
    expect(await screen.findByText("식당 a")).toBeInTheDocument()
    expect(screen.getByText("식당 b")).toBeInTheDocument()
    expect(screen.getByText("식당 c")).toBeInTheDocument()
    expect(screen.getByText("된장찌개")).toBeInTheDocument()
    expect(screen.getByText("8,500원")).toBeInTheDocument()
  })

  it("3일 이내 방문 식당 → 추천 카드 목록에 미포함", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("recent", [{ name: "메뉴", price: 8000 }]),
      makeRestaurant("fresh", [{ name: "메뉴", price: 8000 }]),
    ])
    vi.mocked(storage.loadVisits).mockReturnValue([visitedDaysAgo("recent", 1)])
    render(<RecommendationScreen />)
    await screen.findByText("식당 fresh")
    expect(screen.queryByText("식당 recent")).not.toBeInTheDocument()
  })

  it("모든 식당 3일 이내 방문 → 폴백 배너 + 카드 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("a", [{ name: "메뉴", price: 8000 }]),
    ])
    vi.mocked(storage.loadVisits).mockReturnValue([visitedDaysAgo("a", 1)])
    render(<RecommendationScreen />)
    expect(await screen.findByText(/최근 방문한 곳만 있어요/)).toBeInTheDocument()
    expect(screen.getByText("식당 a")).toBeInTheDocument()
  })

  it("1만원 이하 메뉴가 없는 식당만 있을 때 → 추천 불가 안내 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("a", [{ name: "고급코스", price: 50000 }]),
    ])
    render(<RecommendationScreen />)
    expect(await screen.findByText(/추천 가능한 식당이 없어요/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /식당 추가/i })).toBeInTheDocument()
  })

  it("'다음 추천' 클릭 → 이전 카드와 다른 식당 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("a", [{ name: "메뉴", price: 8000 }]),
      makeRestaurant("b", [{ name: "메뉴", price: 8000 }]),
      makeRestaurant("c", [{ name: "메뉴", price: 8000 }]),
      makeRestaurant("d", [{ name: "메뉴", price: 8000 }]),
    ])
    render(<RecommendationScreen />)
    await screen.findAllByText(/식당 [abcd]/)
    const allNames = ["식당 a", "식당 b", "식당 c", "식당 d"]
    const firstBatch = allNames.filter((name) => screen.queryByText(name))

    fireEvent.click(screen.getByRole("button", { name: /다음 추천/ }))
    await waitFor(() => {
      firstBatch.forEach((name) => {
        expect(screen.queryByText(name)).not.toBeInTheDocument()
      })
    })
  })

  it("'다음 추천' 후 정상 후보 부족 → 폴백 배너 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant("a", [{ name: "메뉴", price: 8000 }]),
      makeRestaurant("b", [{ name: "메뉴", price: 8000 }]),
    ])
    vi.mocked(storage.loadVisits).mockReturnValue([
      visitedDaysAgo("a", 1),
      visitedDaysAgo("b", 2),
    ])
    render(<RecommendationScreen />)
    // 첫 진입부터 폴백 (모두 최근 방문)
    expect(await screen.findByText(/최근 방문한 곳만 있어요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /다음 추천/ }))
    // 다음 추천 후에도 폴백 유지
    await waitFor(() => {
      expect(screen.getByText(/최근 방문한 곳만 있어요/)).toBeInTheDocument()
    })
  })
})
