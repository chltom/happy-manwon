"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRestaurants } from "@/hooks/use-restaurants"
import { useVisits } from "@/hooks/use-visits"

interface RestaurantDetailProps {
  restaurantId: string
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export function RestaurantDetail({ restaurantId }: RestaurantDetailProps) {
  const router = useRouter()
  const { restaurants, updateMenus, remove } = useRestaurants()
  const { addVisit } = useVisits()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const visited = useRef(false)

  const restaurant = restaurants.find((r) => r.id === restaurantId)

  useEffect(() => {
    if (!visited.current) {
      visited.current = true
      addVisit(restaurantId, getToday())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!restaurant) {
    return <p className="text-sm text-muted-foreground">식당을 찾을 수 없어요</p>
  }

  function handleRemoveMenu(menuId: string) {
    updateMenus(restaurant!.id, restaurant!.menus.filter((m) => m.id !== menuId))
  }

  function handleDeleteRestaurant() {
    remove(restaurantId)
    router.push("/restaurants")
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-lg">{restaurant.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{restaurant.category}</Badge>
            <span className="text-xs text-muted-foreground">{restaurant.address}</span>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              aria-label="삭제 확인"
              onClick={handleDeleteRestaurant}
            >
              삭제
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="취소"
              onClick={() => setConfirmDelete(false)}
            >
              취소
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label="식당 삭제"
            onClick={() => setConfirmDelete(true)}
          >
            삭제
          </Button>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">메뉴</p>
        {restaurant.menus.length === 0 ? (
          <p className="text-xs text-muted-foreground">메뉴 없음</p>
        ) : (
          restaurant.menus.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{m.name}</span>
                <span className="text-xs text-muted-foreground">
                  {m.price.toLocaleString("ko-KR")}원
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-label="메뉴 삭제"
                onClick={() => handleRemoveMenu(m.id)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
