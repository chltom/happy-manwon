"use client"

import { useState, useEffect } from "react"
import { loadRestaurants, saveRestaurants } from "@/lib/storage"
import type { Restaurant, Menu } from "@/types/restaurant"

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    setRestaurants(loadRestaurants())
  }, [])

  function add(data: Omit<Restaurant, "id" | "createdAt">) {
    const current = loadRestaurants()
    const next = [
      ...current,
      { ...data, id: crypto.randomUUID(), createdAt: Date.now() },
    ]
    saveRestaurants(next)
    setRestaurants(next)
  }

  function updateMenus(id: string, menus: Menu[]) {
    const current = loadRestaurants()
    const next = current.map((r) => (r.id === id ? { ...r, menus } : r))
    saveRestaurants(next)
    setRestaurants(next)
  }

  function remove(id: string) {
    const current = loadRestaurants()
    const next = current.filter((r) => r.id !== id)
    saveRestaurants(next)
    setRestaurants(next)
  }

  return { restaurants, add, updateMenus, remove }
}
