"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UtensilsCrossed, Star } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { href: "/", label: "추천", Icon: Star },
    { href: "/restaurants", label: "식당", Icon: UtensilsCrossed },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex max-w-md mx-auto">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center flex-1 py-3 gap-0.5 text-xs ${
                active ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
