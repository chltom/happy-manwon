import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "./route"
import type { KakaoNearbyResponse } from "@/lib/kakao"

function makeDoc(name: string, i: number) {
  return {
    place_name: name,
    address_name: `서울 강남구 테헤란로 ${i}`,
    road_address_name: `서울 강남구 테헤란로 ${i}`,
    category_name: "음식점 > 한식",
    x: "127.0",
    y: "37.5",
    distance: String(i * 100),
  }
}

const mockPage1: KakaoNearbyResponse = {
  documents: Array.from({ length: 15 }, (_, i) => makeDoc(`식당${i + 1}`, i + 1)),
  meta: { total_count: 20, is_end: false },
}
const mockPage2: KakaoNearbyResponse = {
  documents: Array.from({ length: 5 }, (_, i) => makeDoc(`식당${16 + i}`, 16 + i)),
  meta: { total_count: 20, is_end: true },
}

beforeEach(() => {
  vi.stubEnv("KAKAO_API_KEY", "test-key")
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("GET /api/kakao-nearby", () => {
  it("lat/lng 전달 → 2km 반경 식당 places 반환", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockPage1), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(mockPage2), { status: 200 }))

    const req = new Request("http://localhost/api/kakao-nearby?lat=37.5&lng=127.0")
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.places).toHaveLength(20)
    expect(body.places[0]).toMatchObject({ name: "식당1", lat: 37.5, lng: 127.0 })
  })

  it("is_end=true → 해당 페이지에서 중단, 카카오 API 1회만 호출", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ...mockPage1, meta: { total_count: 15, is_end: true } }),
        { status: 200 }
      )
    )

    const req = new Request("http://localhost/api/kakao-nearby?lat=37.5&lng=127.0")
    await GET(req)

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it("최대 3페이지까지만 호출", async () => {
    const pageBody = JSON.stringify({ ...mockPage1, meta: { total_count: 100, is_end: false } })
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(pageBody, { status: 200 }))
      .mockResolvedValueOnce(new Response(pageBody, { status: 200 }))
      .mockResolvedValueOnce(new Response(pageBody, { status: 200 }))

    const req = new Request("http://localhost/api/kakao-nearby?lat=37.5&lng=127.0")
    await GET(req)

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3)
  })

  it("lat/lng 누락 → 400 반환", async () => {
    const req = new Request("http://localhost/api/kakao-nearby")
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("잘못된 좌표 → 400 반환", async () => {
    const req = new Request("http://localhost/api/kakao-nearby?lat=abc&lng=127.0")
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("KAKAO_API_KEY 미설정 → 500 반환", async () => {
    vi.unstubAllEnvs()
    delete process.env.KAKAO_API_KEY
    const req = new Request("http://localhost/api/kakao-nearby?lat=37.5&lng=127.0")
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
