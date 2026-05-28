import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect } from "vitest"
import { RestaurantForm } from "./restaurant-form"

const initialData = { name: "테스트 식당", address: "서울 강남구", category: "한식" }

describe("RestaurantForm", () => {
  it("메뉴명 비어 있으면 '추가' 버튼 비활성", () => {
    render(<RestaurantForm initialData={initialData} onSave={vi.fn()} />)
    const addBtn = screen.getByRole("button", { name: /추가/ })
    expect(addBtn).toBeDisabled()
  })

  it("가격 0 이하이면 '추가' 버튼 비활성", () => {
    render(<RestaurantForm initialData={initialData} onSave={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/메뉴명/), { target: { value: "된장찌개" } })
    fireEvent.change(screen.getByPlaceholderText(/가격/), { target: { value: "0" } })
    expect(screen.getByRole("button", { name: /추가/ })).toBeDisabled()
  })

  it("메뉴 추가 → 목록에 '된장찌개 8,500원' 표시", () => {
    render(<RestaurantForm initialData={initialData} onSave={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/메뉴명/), { target: { value: "된장찌개" } })
    fireEvent.change(screen.getByPlaceholderText(/가격/), { target: { value: "8500" } })
    fireEvent.click(screen.getByRole("button", { name: /추가/ }))
    expect(screen.getByText("된장찌개")).toBeInTheDocument()
    expect(screen.getByText("8,500원")).toBeInTheDocument()
  })

  it("저장 → onSave 이름·주소·카테고리·메뉴 포함하여 호출", () => {
    const onSave = vi.fn()
    render(<RestaurantForm initialData={initialData} onSave={onSave} />)
    fireEvent.change(screen.getByPlaceholderText(/메뉴명/), { target: { value: "된장찌개" } })
    fireEvent.change(screen.getByPlaceholderText(/가격/), { target: { value: "8500" } })
    fireEvent.click(screen.getByRole("button", { name: /추가/ }))
    fireEvent.click(screen.getByRole("button", { name: /저장/ }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "테스트 식당",
        address: "서울 강남구",
        category: "한식",
        menus: expect.arrayContaining([
          expect.objectContaining({ name: "된장찌개", price: 8500 }),
        ]),
      })
    )
  })
})
