"use client"

import { useRouter } from "next/navigation"

/**
 * Client-side navigation for `<a>` elements inside an SVG, which
 * next/link can't render. Plain links still work before hydration.
 */
export function SvgLinkRouter({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  return (
    <div
      className="contents"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return
        const link =
          event.target instanceof Element ? event.target.closest("a") : null
        const href = link?.getAttribute("href")
        if (!href?.startsWith("/")) return
        event.preventDefault()
        router.push(href, { scroll: false })
      }}
    >
      {children}
    </div>
  )
}
