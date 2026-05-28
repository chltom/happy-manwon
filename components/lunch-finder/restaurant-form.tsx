"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import type { Menu } from "@/types/restaurant"

interface RestaurantFormData {
  name: string
  address: string
  category: string
  menus: Menu[]
}

interface RestaurantFormProps {
  initialData: { name: string; address: string; category: string }
  onSave: (data: RestaurantFormData) => void
}

export function RestaurantForm({ initialData, onSave }: RestaurantFormProps) {
  const [name, setName] = useState(initialData.name)
  const [address, setAddress] = useState(initialData.address)
  const [category, setCategory] = useState(initialData.category)
  const [menus, setMenus] = useState<Menu[]>([])
  const [menuName, setMenuName] = useState("")
  const [menuPrice, setMenuPrice] = useState("")

  const canAddMenu = menuName.trim().length > 0 && Number(menuPrice) > 0
  const canSave = name.trim().length > 0

  function handleAddMenu() {
    setMenus([
      ...menus,
      { id: crypto.randomUUID(), name: menuName.trim(), price: Number(menuPrice) },
    ])
    setMenuName("")
    setMenuPrice("")
  }

  function handleRemoveMenu(id: string) {
    setMenus(menus.filter((m) => m.id !== id))
  }

  function handleSave() {
    onSave({ name, address, category, menus })
  }

  return (
    <div className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="r-name">식당 이름</FieldLabel>
          <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="r-address">주소</FieldLabel>
          <Input id="r-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="r-category">카테고리</FieldLabel>
          <Input id="r-category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">메뉴</p>
        <div className="flex gap-2">
          <Input
            placeholder="메뉴명"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
          />
          <Input
            placeholder="가격 (원)"
            type="number"
            min={1}
            value={menuPrice}
            onChange={(e) => setMenuPrice(e.target.value)}
            className="w-28"
          />
          <Button onClick={handleAddMenu} disabled={!canAddMenu}>
            추가
          </Button>
        </div>

        {menus.length === 0 ? (
          <p className="text-xs text-muted-foreground">메뉴 없음</p>
        ) : (
          <div className="flex flex-col gap-2">
            {menus.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{m.name}</span>
                  <Badge variant="secondary">{m.price.toLocaleString("ko-KR")}원</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleRemoveMenu(m.id)}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={!canSave}>저장</Button>
    </div>
  )
}
