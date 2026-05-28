import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { NearbyRestaurantImport } from "./nearby-restaurant-import"
import * as useRestaurantsModule from "@/hooks/use-restaurants"
import type { Restaurant } from "@/types/restaurant"

function mockGeolocation(denied = false) {
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: {
      getCurrentPosition: vi.fn((success, error) => {
        if (denied) {
          error({ code: 1, message: "denied" })
        } else {
          success({ coords: { latitude: 37.5, longitude: 127.0 } })
        }
      }),
    },
  })
}

const mockAdd = vi.fn()
const existingRestaurant: Restaurant = {
  id: "1",
  name: "기존식당",
  address: "서울 강남구",
  category: "음식점 > 한식",
  menus: [],
  createdAt: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("fetch", vi.fn())
  mockGeolocation()
  vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
    restaurants: [existingRestaurant],
    add: mockAdd,
    updateMenus: vi.fn(),
    remove: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("NearbyRestaurantImport", () => {
  it("초기 상태 → 버튼 렌더링", () => {
    render(<NearbyRestaurantImport />)
    expect(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ })).toBeInTheDocument()
  })

  it("탐색 성공 → 새 식당 추가되고 결과 표시", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          places: [
            { name: "새식당A", address: "서울 강남구 테헤란로 1", category: "음식점 > 한식", lat: 37.5, lng: 127.0 },
            { name: "새식당B", address: "서울 강남구 테헤란로 2", category: "음식점 > 양식", lat: 37.5, lng: 127.0 },
            { name: "기존식당", address: "서울 강남구", category: "음식점 > 한식", lat: 37.5, lng: 127.0 },
          ],
        }),
        { status: 200 }
      )
    )

    render(<NearbyRestaurantImport />)
    fireEvent.click(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ }))

    await waitFor(() => {
      expect(screen.getByText(/2개 추가됨/)).toBeInTheDocument()
    })
    expect(screen.getByText(/1개 중복 건너뜀/)).toBeInTheDocument()
    expect(mockAdd).toHaveBeenCalledTimes(2)
  })

  it("중복 없으면 건너뜀 문구 표시 안 함", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          places: [
            { name: "새식당A", address: "서울 강남구 테헤란로 1", category: "음식점 > 한식", lat: 37.5, lng: 127.0 },
          ],
        }),
        { status: 200 }
      )
    )

    render(<NearbyRestaurantImport />)
    fireEvent.click(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ }))

    await waitFor(() => {
      expect(screen.getByText(/1개 추가됨/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/중복/)).not.toBeInTheDocument()
  })

  it("위치 권한 거부 → 에러 메시지 표시", async () => {
    vi.unstubAllGlobals()
    mockGeolocation(true)
    vi.stubGlobal("fetch", vi.fn())
    vi.spyOn(useRestaurantsModule, "useRestaurants").mockReturnValue({
      restaurants: [],
      add: mockAdd,
      updateMenus: vi.fn(),
      remove: vi.fn(),
    })

    render(<NearbyRestaurantImport />)
    fireEvent.click(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ }))

    await waitFor(() => {
      expect(screen.getByText(/위치 권한이 필요합니다/)).toBeInTheDocument()
    })
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it("API 오류 → 에러 메시지 표시", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }))

    render(<NearbyRestaurantImport />)
    fireEvent.click(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ }))

    await waitFor(() => {
      expect(screen.getByText(/식당 탐색에 실패했습니다/)).toBeInTheDocument()
    })
  })

  it("onDone 콜백 → 추가 완료 후 호출", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ places: [] }), { status: 200 })
    )
    const onDone = vi.fn()

    render(<NearbyRestaurantImport onDone={onDone} />)
    fireEvent.click(screen.getByRole("button", { name: /주변 2km 식당 자동 추가/ }))

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })
  })
})
