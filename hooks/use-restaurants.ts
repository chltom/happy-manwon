"use client"

import { useState, useEffect } from "react"
import { loadRestaurants, saveRestaurants } from "@/lib/storage"
import type { Restaurant, Menu } from "@/types/restaurant"

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    setRestaurants(loadRestaurants())
    function onUpdate() {
      setRestaurants(loadRestaurants())
    }
    window.addEventListener("restaurants-updated", onUpdate)
    return () => window.removeEventListener("restaurants-updated", onUpdate)
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

  function batchUpdateMenus(updates: { id: string; menus: Menu[] }[]) {
    const map = new Map(updates.map((u) => [u.id, u.menus]))
    const current = loadRestaurants()
    const next = current.map((r) => (map.has(r.id) ? { ...r, menus: map.get(r.id)! } : r))
    saveRestaurants(next)
    setRestaurants(next)
  }

  function remove(id: string) {
    const current = loadRestaurants()
    const next = current.filter((r) => r.id !== id)
    saveRestaurants(next)
    setRestaurants(next)
  }

  return { restaurants, add, updateMenus, batchUpdateMenus, remove }
}
