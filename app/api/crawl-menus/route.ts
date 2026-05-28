import type { Menu } from "@/types/restaurant"
import type { Browser, Page } from "playwright-core"

// Vercel 서버리스 함수 설정
export const maxDuration = 60

interface CrawlTarget {
  id: string
  kakaoId: string
}

interface CrawlResult {
  restaurantId: string
  menus: Menu[]
}

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core")

  if (process.env.VERCEL) {
    const sparticuz = (await import("@sparticuz/chromium")).default
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    })
  }

  // 로컬 개발: 시스템 Chrome 우선, 없으면 기본 설치 경로
  try {
    return await chromium.launch({ channel: "chrome", headless: true })
  } catch {
    return await chromium.launch({ headless: true })
  }
}

async function scrapeMenus(page: Page): Promise<{ name: string; price: number }[]> {
  await page.waitForSelector(".info_goods", { timeout: 8000 }).catch(() => null)
  await page.waitForTimeout(500)

  const moreBtn = await page.$("a.link_more")
  if (moreBtn) {
    const text = await moreBtn.textContent()
    if (text?.includes("메뉴")) {
      await moreBtn.click()
      await page.waitForTimeout(1500)
    }
  }

  return page.evaluate((): { name: string; price: number }[] => {
    const items: { name: string; price: number }[] = []
    document.querySelectorAll(".info_goods").forEach((el) => {
      const name = el.querySelector(".tit_item")?.textContent?.trim()
      const priceText = el.querySelector(".desc_item")?.textContent?.trim()
      if (!name) return
      const priceMatch = priceText?.match(/[\d,]+/)
      const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ""), 10) : 0
      items.push({ name, price })
    })
    return items
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const targets: CrawlTarget[] = body.targets ?? []

  if (targets.length === 0) {
    return Response.json({ results: [] })
  }

  let browser: Browser | null = null

  try {
    browser = await launchBrowser()
  } catch (e) {
    return Response.json(
      { error: `브라우저를 실행할 수 없습니다. (${e})` },
      { status: 503 }
    )
  }

  const results: CrawlResult[] = []

  try {
    for (const target of targets) {
      const page = await browser.newPage()
      try {
        await page.goto(`https://place.map.kakao.com/${target.kakaoId}`, { timeout: 20000 })
        const menus = await scrapeMenus(page)
        results.push({
          restaurantId: target.id,
          menus: menus.map((m) => ({ ...m, id: crypto.randomUUID() })),
        })
      } catch {
        results.push({ restaurantId: target.id, menus: [] })
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }

  return Response.json({ results })
}
