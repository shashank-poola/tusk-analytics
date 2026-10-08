"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight, Code, Heart, Package, Triangle } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { TabList } from "@/components/ui/tab-list"

import type { Snippets } from "@/features/onboarding/utils/snippets"
import { CodeBlock } from "./code-block"
import { CookielessSwitch } from "./cookieless-switch"
import { InstallHint } from "./install-hint"
import { LovableInstall } from "./lovable-install"

const TABS = [
  { id: "script", label: "Script", icon: Code },
  { id: "nextjs", label: "Next.js", icon: Triangle },
  { id: "npm", label: "npm", icon: Package },
  { id: "lovable", label: "Lovable", icon: Heart },
] as const

type Tab = (typeof TABS)[number]["id"]

type InstallPanelProps = {
  /** The snippets with cookies, and without. */
  snippets: { standard: Snippets; cookieless: Snippets }
  /** Where "I've added the script" goes: the site's dashboard. */
  continueHref: string
}

/**
 * Every way to install, one tab each, with the cookieless switch on top.
 * "I've added the script" goes straight to the dashboard, which waits for
 * the first visit there.
 */
export function InstallPanel({ snippets, continueHref }: InstallPanelProps) {
  const id = useId()
  const [tab, setTab] = useState<Tab>("script")
  const [cookieless, setCookieless] = useState(false)
  const current = cookieless ? snippets.cookieless : snippets.standard

  return (
    <div className="space-y-5">
      <TabList
        label="How to install"
        tabs={TABS}
        active={tab}
        onChange={(next) => setTab(next as Tab)}
        idPrefix={id}
      />

      <CookielessSwitch on={cookieless} onChange={setCookieless} />

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${tab}`}
        tabIndex={0}
        className="space-y-3 rounded-2xl"
      >
        {tab === "script" && (
          <>
            <InstallHint>
              Paste it into the &lt;head&gt; of every page.
            </InstallHint>
            <CodeBlock label="index.html" code={current.html} />
          </>
        )}
        {tab === "nextjs" && (
          <>
            <InstallHint>
              Add it to your root layout, inside &lt;body&gt;.
            </InstallHint>
            <CodeBlock label="app/layout.tsx" code={current.nextjs} />
          </>
        )}
        {tab === "npm" && (
          <>
            <InstallHint>
              For any framework: start Tusk from your app code and send goals
              with <code className="font-mono">track(&quot;signup&quot;)</code>.
              The package is on its way to npm; until then, use the script.
            </InstallHint>
            <CodeBlock
              label="Terminal"
              code={current.npm.install}
              copyLabel="Copy command"
            />
            <CodeBlock label="Your app's entry" code={current.npm.code} />
          </>
        )}
        {tab === "lovable" && <LovableInstall prompt={current.aiPrompt} />}
      </div>

      <div className="border-t-2 border-border pt-5">
        <Link
          href={continueHref}
          className={cn(BUTTON_CLASSES.primary, "w-full")}
        >
          I&apos;ve added the script
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <p className="mt-3 text-center text-[13px] text-muted-foreground">
          Your dashboard waits for the first visit and lights up when it lands.
        </p>
      </div>
    </div>
  )
}
