import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RestaurantDetail } from "@/components/lunch-finder/restaurant-detail"

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="flex flex-col min-h-svh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">뒤로</span>
      </div>
      <RestaurantDetail restaurantId={id} />
    </main>
  )
}
