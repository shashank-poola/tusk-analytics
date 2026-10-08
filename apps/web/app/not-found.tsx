import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { routes } from "@/lib/routes"

import { SiteHeader } from "@/features/marketing/components/site-header"

export const metadata: Metadata = { title: "Page not found" }

/**
 * Every unknown URL and every `notFound()`, including someone else's site
 * (which must look exactly like a missing one). Playful mode: the landing
 * header, Tusk lost with his map, a plain explanation and two ways back.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 pb-16 sm:flex-row sm:gap-14 sm:px-6">
        <Image
          src="/mascot/404.png"
          alt="Tusk the hippo, puzzled, reading a map"
          width={320}
          height={320}
          priority
          className="size-60 shrink-0 sm:size-80"
        />

        <div className="max-w-md text-center sm:text-left">
          <h1 className="text-[2.5rem] leading-[1.1] text-balance">
            Tusk couldn&apos;t find this page.
          </h1>
          <p className="mt-4 text-muted-foreground">
            The link may be old or mistyped, or the page has moved. Your numbers
            are safe; here&apos;s the way back to them.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link href={routes.dashboard} className={BUTTON_CLASSES.primary}>
              Go to dashboard
            </Link>
            <Link href={routes.home} className={BUTTON_CLASSES.secondary}>
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
