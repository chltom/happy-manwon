import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { AddRestaurantSearch } from "./add-restaurant-search"
import type { KakaoPlace } from "@/lib/kakao"

const mockPlaces: KakaoPlace[] = [
  { name: "청국장집", address: "서울 강남구", category: "음식점 > 한식" },
  { name: "비빔밥집", address: "서울 서초구", category: "음식점 > 한식" },
]

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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn())
  mockGeolocation(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("AddRestaurantSearch", () => {
  it("검색어 입력 후 검색 → 결과 목록 표시", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ places: mockPlaces }), { status: 200 })
    )
    const onSelect = vi.fn()
    render(<AddRestaurantSearch onSelect={onSelect} />)

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "청국장" } })
    fireEvent.submit(screen.getByRole("form"))

    expect(await screen.findByText("청국장집")).toBeInTheDocument()
    expect(screen.getByText("비빔밥집")).toBeInTheDocument()
  })

  it("결과 항목 선택 → onSelect 호출", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ places: mockPlaces }), { status: 200 })
    )
    const onSelect = vi.fn()
    render(<AddRestaurantSearch onSelect={onSelect} />)

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "청국장" } })
    fireEvent.submit(screen.getByRole("form"))
    await screen.findByText("청국장집")
    fireEvent.click(screen.getByText("청국장집"))

    expect(onSelect).toHaveBeenCalledWith(mockPlaces[0])
  })

  it("위치 권한 거부 → 안내 문구 표시", async () => {
    vi.unstubAllGlobals()
    mockGeolocation(true)
    vi.stubGlobal("fetch", vi.fn())
    const onSelect = vi.fn()
    render(<AddRestaurantSearch onSelect={onSelect} />)
    expect(await screen.findByText(/위치 권한 없음/)).toBeInTheDocument()
  })
})
