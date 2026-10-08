"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

const OPTIONS = [
  { theme: "light", label: "Light theme", Icon: Sun },
  { theme: "dark", label: "Dark theme", Icon: Moon },
  { theme: "system", label: "Match my system", Icon: Monitor },
] as const

/**
 * Light, dark or the system's choice, for the footer's blue band. The
 * server can't know the theme, so nothing is pressed until it mounts.
 */
export function FooterThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-full bg-white/10 p-1"
    >
      {OPTIONS.map(({ theme: option, label, Icon }) => {
        const active = mounted && theme === option
        return (
          <button
            key={option}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => setTheme(option)}
            className={cn(
              "inline-grid size-11 place-items-center rounded-full transition-colors sm:size-9",
              active
                ? "bg-white text-deep-water"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
