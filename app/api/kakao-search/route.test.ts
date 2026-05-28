import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { GET } from "./route"
import type { KakaoSearchResponse } from "@/lib/kakao"

const mockKakaoResponse: KakaoSearchResponse = {
  documents: [
    {
      place_name: "청국장집",
      address_name: "서울 강남구 테헤란로 1",
      road_address_name: "서울 강남구 테헤란로 1",
      category_name: "음식점 > 한식 > 찌개,전골",
    },
  ],
  meta: { total_count: 1 },
}

beforeEach(() => {
  vi.stubEnv("KAKAO_API_KEY", "test-key")
  vi.stubGlobal("fetch", vi.fn())
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("GET /api/kakao-search", () => {
  it("검색어만 있을 때 → places 배열 반환", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockKakaoResponse), { status: 200 })
    )
    const req = new Request("http://localhost/api/kakao-search?q=청국장")
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.places).toHaveLength(1)
    expect(body.places[0]).toEqual({
      name: "청국장집",
      address: "서울 강남구 테헤란로 1",
      category: "음식점 > 한식 > 찌개,전골",
    })
  })

  it("lat/lng 포함 시 → 카카오 API에 x/y 파라미터 포함하여 요청", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ documents: [], meta: { total_count: 0 } }), { status: 200 })
    )
    const req = new Request("http://localhost/api/kakao-search?q=식당&lat=37.5&lng=127.0")
    await GET(req)
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain("y=37.5")
    expect(calledUrl).toContain("x=127.0")
  })

  it("KAKAO_API_KEY 미설정 시 → 500 반환", async () => {
    vi.unstubAllEnvs()
    delete process.env.KAKAO_API_KEY
    const req = new Request("http://localhost/api/kakao-search?q=식당")
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
