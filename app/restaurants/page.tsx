import { RestaurantList } from "@/components/lunch-finder/restaurant-list"

export default function RestaurantsPage() {
  return (
    <main className="flex flex-col min-h-svh max-w-md mx-auto px-4 py-6 pb-20">
      <h1 className="font-bold text-base mb-5">식당 목록</h1>
      <RestaurantList />
    </main>
  )
}
