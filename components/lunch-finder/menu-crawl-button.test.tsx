import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MenuCrawlButton } from "./menu-crawl-button"
import * as useRestaurantsModule from "@/hooks/use-restaurants"

const mockBatchUpdateMenus = vi.fn()

function makeRestaurant(overrides: Partial<{
  id: string
  name: string
  kakaoId: string
  menus: { id: string; name: string; price: number }[]
}> = {}) {
  return {
    id: "r1",
    name: "식당1",
    category: "한식",
    address: "서울",
    createdAt: 0,
    kakaoId: "k1",
    menus: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe("MenuCrawlButton", () => {
  it("kakaoId 없는 식당만 있으면 렌더링하지 않는다", () => {
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [makeRestaurant({ kakaoId: undefined })],
      batchUpdateMenus: mockBatchUpdateMenus,
      add: vi.fn(),
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })
    const { container } = render(<MenuCrawlButton />)
    expect(container.firstChild).toBeNull()
  })

  it("kakaoId 있는 식당만 체크박스 목록에 표시된다", async () => {
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [
        makeRestaurant({ id: "r1", name: "카카오식당", kakaoId: "k1" }),
        makeRestaurant({ id: "r2", name: "미등록식당", kakaoId: undefined }),
      ],
      batchUpdateMenus: mockBatchUpdateMenus,
      add: vi.fn(),
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })
    render(<MenuCrawlButton />)

    fireEvent.click(screen.getByRole("button", { name: /메뉴 자동 채우기/ }))

    expect(screen.getByLabelText("카카오식당")).toBeDefined()
    expect(screen.queryByLabelText("미등록식당")).toBeNull()
  })

  it("메뉴 없는 식당만 기본 선택된다", async () => {
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [
        makeRestaurant({ id: "r1", name: "메뉴없음", kakaoId: "k1", menus: [] }),
        makeRestaurant({ id: "r2", name: "메뉴있음", kakaoId: "k2", menus: [{ id: "m1", name: "비빔밥", price: 8000 }] }),
      ],
      batchUpdateMenus: mockBatchUpdateMenus,
      add: vi.fn(),
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })
    render(<MenuCrawlButton />)

    fireEvent.click(screen.getByRole("button", { name: /메뉴 자동 채우기/ }))

    const noMenuCheckbox = screen.getByLabelText("메뉴없음")
    const hasMenuCheckbox = screen.getByLabelText("메뉴있음")
    expect(noMenuCheckbox.getAttribute("data-state")).toBe("checked")
    expect(hasMenuCheckbox.getAttribute("data-state")).toBe("unchecked")
  })

  it("전체 선택/해제가 동작한다", async () => {
    // 식당B는 메뉴 있음 → 기본 미선택, 식당A만 기본 선택
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [
        makeRestaurant({ id: "r1", name: "식당A", kakaoId: "k1", menus: [] }),
        makeRestaurant({ id: "r2", name: "식당B", kakaoId: "k2", menus: [{ id: "m1", name: "비빔밥", price: 8000 }] }),
      ],
      batchUpdateMenus: mockBatchUpdateMenus,
      add: vi.fn(),
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })
    render(<MenuCrawlButton />)

    fireEvent.click(screen.getByRole("button", { name: /메뉴 자동 채우기/ }))

    // 식당B 미선택 상태에서 전체 선택
    expect(screen.getByLabelText("식당B").getAttribute("data-state")).toBe("unchecked")
    fireEvent.click(screen.getByLabelText("전체 선택"))
    expect(screen.getByLabelText("식당A").getAttribute("data-state")).toBe("checked")
    expect(screen.getByLabelText("식당B").getAttribute("data-state")).toBe("checked")

    // 전체 해제
    fireEvent.click(screen.getByLabelText("전체 선택"))
    expect(screen.getByLabelText("식당A").getAttribute("data-state")).toBe("unchecked")
    expect(screen.getByLabelText("식당B").getAttribute("data-state")).toBe("unchecked")
  })

  it("선택된 식당만 fetch에 포함된다", async () => {
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [
        makeRestaurant({ id: "r1", name: "식당A", kakaoId: "k1" }),
        makeRestaurant({ id: "r2", name: "식당B", kakaoId: "k2" }),
      ],
      batchUpdateMenus: mockBatchUpdateMenus,
      add: vi.fn(),
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    })
    render(<MenuCrawlButton />)

    fireEvent.click(screen.getByRole("button", { name: /메뉴 자동 채우기/ }))

    // 식당A만 선택 (기본 선택 전체), 식당B 체크 해제
    fireEvent.click(screen.getByLabelText("식당B"))

    fireEvent.click(screen.getByRole("button", { name: /선택한 1개 크롤링/ }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
      expect(body.targets).toHaveLength(1)
      expect(body.targets[0].id).toBe("r1")
    })
  })
})
