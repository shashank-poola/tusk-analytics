"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { TabList } from "@/components/ui/tab-list"

import type { Snippets } from "@/features/onboarding/utils/snippets"
import { CodeBlock } from "./code-block"
import { CookielessSwitch } from "./cookieless-switch"
import { LovableInstall } from "./lovable-install"

const TABS = [
  {
    id: "nextjs",
    label: "Next.js",
    logo: { src: "/icons/platforms/nextjs.svg", invertInDark: true },
  },
  { id: "npm", label: "npm", logo: { src: "/icons/platforms/npm.svg" } },
  {
    id: "lovable",
    label: "Lovable",
    logo: { src: "/icons/platforms/lovable.svg" },
  },
  {
    id: "shopify",
    label: "Shopify",
    logo: { src: "/icons/platforms/shopify.svg" },
  },
] as const

type Tab = (typeof TABS)[number]["id"]

type InstallPanelProps = {
  /** The snippets with cookies, and without. */
  snippets: { standard: Snippets; cookieless: Snippets }
  /** Where "I've added the script" goes: the site's dashboard. */
  continueHref: string
}

/**
 * One tab per way to install, the cookieless switch, the snippet and the
 * button: nothing else, so the card stays small.
 */
export function InstallPanel({ snippets, continueHref }: InstallPanelProps) {
  const id = useId()
  const [tab, setTab] = useState<Tab>("nextjs")
  const [cookieless, setCookieless] = useState(false)
  const current = cookieless ? snippets.cookieless : snippets.standard

  return (
    <div className="space-y-4">
      <TabList
        label="How to install"
        tabs={TABS}
        active={tab}
        onChange={(next) => setTab(next as Tab)}
        idPrefix={id}
        stretch
      />

      <CookielessSwitch on={cookieless} onChange={setCookieless} />

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}`}
        tabIndex={0}
        className="space-y-3 rounded-xl"
      >
        {tab === "nextjs" && (
          <CodeBlock label="app/layout.tsx" code={current.nextjs} />
        )}
        {tab === "npm" && (
          <>
            <CodeBlock label="Terminal" code={current.npm.install} />
            <CodeBlock label="Your app" code={current.npm.code} />
          </>
        )}
        {tab === "lovable" && <LovableInstall prompt={current.aiPrompt} />}
        {tab === "shopify" && (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-[13px] text-muted-foreground">
              <li>Online Store → Themes → Edit code</li>
              <li>
                In <span className="font-mono">theme.liquid</span>, paste this
                before <span className="font-mono">&lt;/head&gt;</span> and save
              </li>
            </ol>
            <CodeBlock label="theme.liquid" code={current.html} />
          </>
        )}
      </div>

      <Link
        href={continueHref}
        className={cn(BUTTON_CLASSES.primary, "w-full")}
      >
        I&apos;ve added the script
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  )
}
