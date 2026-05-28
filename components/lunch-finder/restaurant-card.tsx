import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Restaurant } from "@/types/restaurant"
import { PRICE_LIMIT } from "@/lib/recommend"

interface RestaurantCardProps {
  restaurant: Restaurant
  dimmed?: boolean
  visitedLabel?: string
}

export function RestaurantCard({ restaurant, dimmed, visitedLabel }: RestaurantCardProps) {
  const cheapest = restaurant.menus
    .filter((m) => m.price <= PRICE_LIMIT)
    .sort((a, b) => a.price - b.price)[0]

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block">
      <Card className={dimmed ? "opacity-60" : ""}>
        <CardContent className="flex items-center justify-between px-4 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm truncate">{restaurant.name}</span>
              <Badge variant="secondary">{restaurant.category}</Badge>
              {visitedLabel && (
                <span className="text-xs text-muted-foreground">{visitedLabel}</span>
              )}
            </div>
            {cheapest && (
              <p className="text-xs text-muted-foreground">
                <span>{cheapest.name}</span>
                {" · "}
                <span className="font-medium text-foreground">
                  {cheapest.price.toLocaleString("ko-KR")}원
                </span>
              </p>
            )}
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 ml-2" />
        </CardContent>
      </Card>
    </Link>
  )
}
