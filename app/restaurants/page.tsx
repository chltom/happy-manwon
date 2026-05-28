import { RestaurantList } from "@/components/lunch-finder/restaurant-list"
import { NearbyRestaurantImport } from "@/components/lunch-finder/nearby-restaurant-import"
import { MenuCrawlButton } from "@/components/lunch-finder/menu-crawl-button"

export default function RestaurantsPage() {
  return (
    <main className="flex flex-col min-h-svh max-w-md mx-auto px-4 py-6 pb-20">
      <h1 className="font-bold text-base mb-5">식당 목록</h1>
      <div className="mb-4 flex flex-col gap-2">
        <NearbyRestaurantImport />
        <MenuCrawlButton />
      </div>
      <RestaurantList />
    </main>
  )
}
