import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { RestaurantList } from "./restaurant-list"
import * as storage from "@/lib/storage"
import type { Restaurant } from "@/types/restaurant"

vi.mock("@/lib/storage")
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/restaurants",
}))

function makeRestaurant(id: string): Restaurant {
  return {
    id,
    name: `식당 ${id}`,
    category: "한식",
    address: "서울",
    menus: [
      { id: `${id}-m1`, name: "메뉴1", price: 8000 },
      { id: `${id}-m2`, name: "메뉴2", price: 9000 },
    ],
    createdAt: Date.now(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(storage.loadRestaurants).mockReturnValue([
    makeRestaurant("a"),
    makeRestaurant("b"),
  ])
  vi.mocked(storage.saveRestaurants).mockImplementation((restaurants) => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([...restaurants])
  })
})

describe("RestaurantList", () => {
  it("목록에 이름·카테고리·메뉴 수·최저가 표시", async () => {
    render(<RestaurantList />)
    expect(await screen.findByText("식당 a")).toBeInTheDocument()
    expect(screen.getByText("식당 b")).toBeInTheDocument()
    expect(screen.getAllByText("한식").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/8,000원/).length).toBeGreaterThanOrEqual(1)
  })

  it("1만원 초과 메뉴만 있는 식당 → 최저가 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      {
        id: "x",
        name: "고급식당",
        category: "양식",
        address: "서울",
        menus: [{ id: "x-m1", name: "코스요리", price: 30000 }],
        createdAt: Date.now(),
      },
    ])
    render(<RestaurantList />)
    expect(await screen.findByText("고급식당")).toBeInTheDocument()
    expect(screen.getByText(/30,000원/)).toBeInTheDocument()
  })

  it("메뉴 없는 식당 → '메뉴를 직접 추가해보세요' 안내 표시", async () => {
    vi.mocked(storage.loadRestaurants).mockReturnValue([
      {
        id: "y",
        name: "메뉴없는식당",
        category: "한식",
        address: "서울",
        menus: [],
        createdAt: Date.now(),
      },
    ])
    render(<RestaurantList />)
    expect(await screen.findByText("메뉴없는식당")).toBeInTheDocument()
    expect(screen.getByText(/메뉴를 직접 추가해보세요/)).toBeInTheDocument()
  })

  it("삭제 트리거 → 해당 행 인라인 확인 상태로 전환", async () => {
    render(<RestaurantList />)
    await screen.findByText("식당 a")
    const deleteButtons = screen.getAllByRole("button", { name: /삭제/ })
    fireEvent.click(deleteButtons[0])
    expect(screen.getByRole("button", { name: /삭제 확인/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /취소/ })).toBeInTheDocument()
  })

  it("확인 후 → 해당 식당 목록에서 사라짐", async () => {
    render(<RestaurantList />)
    await screen.findByText("식당 a")
    const deleteButtons = screen.getAllByRole("button", { name: /삭제/ })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole("button", { name: /삭제 확인/ }))
    await waitFor(() => {
      expect(screen.queryByText("식당 a")).not.toBeInTheDocument()
    })
    expect(screen.getByText("식당 b")).toBeInTheDocument()
  })
})
