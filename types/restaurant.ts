export interface Menu {
  id: string
  name: string
  price: number
}

export interface Restaurant {
  id: string
  name: string
  category: string
  address: string
  menus: Menu[]
  createdAt: number
  lat?: number
  lng?: number
  kakaoId?: string
}

export interface VisitRecord {
  restaurantId: string
  date: string // YYYY-MM-DD
}
