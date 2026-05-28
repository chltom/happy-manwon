export interface KakaoPlace {
  name: string
  address: string
  category: string
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
