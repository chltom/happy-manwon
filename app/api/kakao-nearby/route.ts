import type { KakaoNearbyResponse, KakaoPlace } from "@/lib/kakao"

const KAKAO_CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json"
const MAX_PAGES = 3

export async function GET(request: Request) {
  const apiKey = process.env.KAKAO_API_KEY
  if (!apiKey) {
    return Response.json({ error: "KAKAO_API_KEY not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  if (!lat || !lng) {
    return Response.json({ error: "lat and lng required" }, { status: 400 })
  }
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 })
  }

  const places: KakaoPlace[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      category_group_code: "FD6",
      x: lng,
      y: lat,
      radius: "2000",
      sort: "distance",
      size: "15",
      page: String(page),
    })

    const res = await fetch(`${KAKAO_CATEGORY_URL}?${params}`, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    })

    if (!res.ok) {
      return Response.json({ error: "Kakao API error" }, { status: res.status })
    }

    const data: KakaoNearbyResponse = await res.json()

    for (const doc of data.documents) {
      places.push({
        name: doc.place_name,
        address: doc.road_address_name || doc.address_name,
        category: doc.category_name,
        lat: Number(doc.y),
        lng: Number(doc.x),
      })
    }

    if (data.meta.is_end) break
  }

  return Response.json({ places })
}
