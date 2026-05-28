import type { KakaoSearchResponse, KakaoPlace } from "@/lib/kakao"

const KAKAO_API_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

export async function GET(request: Request) {
  const apiKey = process.env.KAKAO_API_KEY
  if (!apiKey) {
    return Response.json({ error: "KAKAO_API_KEY not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? ""
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!query.trim()) {
    return Response.json({ error: "query required" }, { status: 400 })
  }
  if (lat && lng && (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)))) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 })
  }

  const params = new URLSearchParams({ query, size: "10" })
  if (lat && lng) {
    params.set("y", lat)
    params.set("x", lng)
  }

  const kakaoRes = await fetch(`${KAKAO_API_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  })

  if (!kakaoRes.ok) {
    return Response.json({ error: "Kakao API error" }, { status: kakaoRes.status })
  }

  const data: KakaoSearchResponse = await kakaoRes.json()

  const places: KakaoPlace[] = data.documents.map((doc) => ({
    name: doc.place_name,
    address: doc.road_address_name || doc.address_name,
    category: doc.category_name,
  }))

  return Response.json({ places })
}
