import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { RestaurantDetail } from "./restaurant-detail"
import * as storage from "@/lib/storage"
import type { Restaurant } from "@/types/restaurant"

vi.mock("@/lib/storage")
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const today = new Date().toISOString().slice(0, 10)

function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: "r1",
    name: "된장찌개집",
    category: "한식",
    address: "서울",
    menus: [
      { id: "m1", name: "된장찌개", price: 8000 },
      { id: "m2", name: "순두부찌개", price: 8500 },
    ],
    createdAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(storage.loadRestaurants).mockReturnValue([makeRestaurant()])
  vi.mocked(storage.loadVisits).mockReturnValue([])
  vi.mocked(storage.saveRestaurants).mockImplementation((restaurants) => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([...restaurants])
  })
  // saveVisits persists to loadVisits mock so StrictMode dedup works across remounts
  vi.mocked(storage.saveVisits).mockImplementation((visits) => {
    vi.mocked(storage.loadVisits).mockReturnValue([...visits])
  })
})

describe("RestaurantDetail", () => {
  it("진입 시 전체 메뉴 목록(이름·가격) 표시", async () => {
    render(<RestaurantDetail restaurantId="r1" />)
    expect(await screen.findByText("된장찌개")).toBeInTheDocument()
    expect(screen.getByText("순두부찌개")).toBeInTheDocument()
    expect(screen.getByText("8,000원")).toBeInTheDocument()
  })

  it("진입 시 방문 기록 저장", async () => {
    render(<RestaurantDetail restaurantId="r1" />)
    await waitFor(() => {
      expect(storage.saveVisits).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ restaurantId: "r1", date: today }),
        ])
      )
    })
  })

  it("같은 날 이미 방문한 경우 중복 저장 안 함", async () => {
    // Pre-populate: visit already exists for today
    vi.mocked(storage.loadVisits).mockReturnValue([{ restaurantId: "r1", date: today }])
    render(<RestaurantDetail restaurantId="r1" />)
    await waitFor(() => {
      expect(storage.saveVisits).not.toHaveBeenCalled()
    })
  })

  it("메뉴 × 클릭 → 해당 메뉴 삭제, 나머지는 유지", async () => {
    render(<RestaurantDetail restaurantId="r1" />)
    await screen.findByText("된장찌개")
    const deleteButtons = screen.getAllByRole("button", { name: /메뉴 삭제/ })
    fireEvent.click(deleteButtons[0])
    expect(screen.queryByText("된장찌개")).not.toBeInTheDocument()
    expect(screen.getByText("순두부찌개")).toBeInTheDocument()
  })

  it("마지막 메뉴 삭제 → '메뉴 없음' 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      makeRestaurant({ menus: [{ id: "m1", name: "된장찌개", price: 8000 }] }),
    ])
    render(<RestaurantDetail restaurantId="r1" />)
    await screen.findByText("된장찌개")
    fireEvent.click(screen.getByRole("button", { name: /메뉴 삭제/ }))
    expect(await screen.findByText(/메뉴 없음/)).toBeInTheDocument()
  })

  it("삭제 버튼 클릭 → 인라인 확인 UI 표시", async () => {
    render(<RestaurantDetail restaurantId="r1" />)
    await screen.findByText("된장찌개집")
    fireEvent.click(screen.getByRole("button", { name: /식당 삭제/ }))
    expect(screen.getByRole("button", { name: /삭제 확인/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /취소/ })).toBeInTheDocument()
  })

  it("인라인 확인 후 삭제 → saveRestaurants([]) 호출", async () => {
    render(<RestaurantDetail restaurantId="r1" />)
    await screen.findByText("된장찌개집")
    fireEvent.click(screen.getByRole("button", { name: /식당 삭제/ }))
    fireEvent.click(screen.getByRole("button", { name: /삭제 확인/ }))
    await waitFor(() => {
      expect(storage.saveRestaurants).toHaveBeenCalledWith([])
    })
  })
})
