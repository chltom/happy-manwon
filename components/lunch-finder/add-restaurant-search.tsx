"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group"
import { Card, CardContent } from "@/components/ui/card"
import type { KakaoPlace } from "@/lib/kakao"

interface AddRestaurantSearchProps {
  onSelect: (place: KakaoPlace) => void
}

export function AddRestaurantSearch({ onSelect }: AddRestaurantSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true)
    )
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query })
      if (coords) {
        params.set("lat", String(coords.lat))
        params.set("lng", String(coords.lng))
      }
      const res = await fetch(`/api/kakao-search?${params}`)
      if (!res.ok) throw new Error("search failed")
      const data = await res.json()
      setResults(data.places ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {locationDenied && (
        <p className="text-xs text-muted-foreground">위치 권한 없음 · 이름으로만 검색합니다</p>
      )}
      <form aria-label="form" onSubmit={handleSearch}>
        <InputGroup>
          <InputGroupInput
            role="searchbox"
            placeholder="식당 이름으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="식당 검색"
          />
          <InputGroupAddon>
            <Button type="submit" size="icon" disabled={loading}>
              <Search data-icon="inline-start" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </form>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((place) => (
            <Card key={`${place.name}|${place.address}`} className="cursor-pointer" onClick={() => onSelect(place)}>
              <CardContent className="px-4 py-3">
                <p className="text-sm font-medium">{place.name}</p>
                <p className="text-xs text-muted-foreground">{place.address}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
