"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useRestaurants } from "@/hooks/use-restaurants"
import { PRICE_LIMIT } from "@/lib/recommend"

export function RestaurantList() {
  const { restaurants, remove } = useRestaurants()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function handleDelete(id: string) {
    remove(id)
    setConfirmId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {restaurants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          등록된 식당이 없어요
        </p>
      ) : (
        restaurants.map((r) => {
          const cheapest = r.menus
            .filter((m) => m.price <= PRICE_LIMIT)
            .sort((a, b) => a.price - b.price)[0]

          if (confirmId === r.id) {
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between px-4 py-4">
                  <span className="text-sm font-medium">{r.name} 삭제할까요?</span>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label="삭제 확인"
                      onClick={() => handleDelete(r.id)}
                    >
                      삭제
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="취소"
                      onClick={() => setConfirmId(null)}
                    >
                      취소
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between px-4 py-4">
                <Link href={`/restaurants/${r.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{r.name}</span>
                    <Badge variant="secondary">{r.category}</Badge>
                    <span className="text-xs text-muted-foreground">메뉴 {r.menus.length}개</span>
                  </div>
                  {cheapest && (
                    <p className="text-xs text-muted-foreground">
                      최저 <span className="font-medium text-foreground">{cheapest.price.toLocaleString("ko-KR")}원</span>
                    </p>
                  )}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="삭제"
                  onClick={() => setConfirmId(r.id)}
                  className="ml-2 shrink-0"
                >
                  삭제
                </Button>
              </CardContent>
            </Card>
          )
        })
      )}
      <Button asChild className="mt-2">
        <Link href="/restaurants/add">
          <Plus className="size-4 mr-1" />
          식당 추가
        </Link>
      </Button>
    </div>
  )
}
