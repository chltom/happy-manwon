"use client"

import { useState } from "react"
import { loadRestaurants, saveRestaurants } from "@/lib/storage"
import type { Restaurant, Menu } from "@/types/restaurant"

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => loadRestaurants())

  function add(data: Omit<Restaurant, "id" | "createdAt">) {
    const next = [
      ...restaurants,
      { ...data, id: crypto.randomUUID(), createdAt: Date.now() },
    ]
    saveRestaurants(next)
    setRestaurants(next)
  }

  function updateMenus(id: string, menus: Menu[]) {
    const next = restaurants.map((r) => (r.id === id ? { ...r, menus } : r))
    saveRestaurants(next)
    setRestaurants(next)
  }

  function remove(id: string) {
    const next = restaurants.filter((r) => r.id !== id)
    saveRestaurants(next)
    setRestaurants(next)
  }

  return { restaurants, add, updateMenus, remove }
}
