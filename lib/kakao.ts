export interface KakaoPlace {
  name: string
  address: string
  category: string
  lat?: number
  lng?: number
  kakaoId?: string
}

export interface KakaoDocument {
  place_name: string
  address_name: string
  road_address_name: string
  category_name: string
}

export interface KakaoSearchResponse {
  documents: KakaoDocument[]
  meta: { total_count: number }
}

export interface KakaoNearbyDocument {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  category_name: string
  x: string
  y: string
  distance: string
}

export interface KakaoNearbyResponse {
  documents: KakaoNearbyDocument[]
  meta: { total_count: number; is_end: boolean }
}
