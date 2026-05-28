"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddRestaurantSearch } from "@/components/lunch-finder/add-restaurant-search"
import { RestaurantForm } from "@/components/lunch-finder/restaurant-form"
import { useRestaurants } from "@/hooks/use-restaurants"
import type { KakaoPlace } from "@/lib/kakao"
import type { Menu } from "@/types/restaurant"

type Step = "search" | "form"

export default function AddRestaurantPage() {
  const router = useRouter()
  const { add } = useRestaurants()
  const [step, setStep] = useState<Step>("search")
  const [selected, setSelected] = useState<KakaoPlace | null>(null)

  function handleSelect(place: KakaoPlace) {
    setSelected(place)
    setStep("form")
  }

  function handleSave(data: { name: string; address: string; category: string; menus: Menu[] }) {
    add(data)
    router.push("/restaurants")
  }

  return (
    <main className="flex flex-col min-h-svh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        {step === "search" ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/restaurants">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setStep("search")}>
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <h1 className="font-bold text-base">
          {step === "search" ? "식당 검색" : "식당 정보 입력"}
        </h1>
      </div>

      {step === "search" && <AddRestaurantSearch onSelect={handleSelect} />}
      {step === "form" && selected && (
        <RestaurantForm
          initialData={selected}
          onSave={handleSave}
        />
      )}
    </main>
  )
}
