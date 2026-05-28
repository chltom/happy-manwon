"use client"

import { useState, useEffect } from "react"
import { loadVisits, saveVisits } from "@/lib/storage"
import type { VisitRecord } from "@/types/restaurant"

export function useVisits() {
  const [visits, setVisits] = useState<VisitRecord[]>([])

  useEffect(() => {
    setVisits(loadVisits())
  }, [])

  function addVisit(restaurantId: string, date: string) {
    const current = loadVisits()
    if (current.some((v) => v.restaurantId === restaurantId && v.date === date)) return
    const next = [...current, { restaurantId, date }]
    saveVisits(next)
    setVisits(next)
  }

  return { visits, addVisit }
}
