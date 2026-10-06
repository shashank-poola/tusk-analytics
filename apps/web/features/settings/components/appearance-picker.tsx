"use client"

import { cn } from "@workspace/ui/lib/utils"
import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

const OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

const subscribe = () => () => {}

/** Light, dark or follow the device. Stored per browser by next-themes. */
export function AppearancePicker() {
  const { theme, setTheme } = useTheme()
  // The server can't know the stored theme; select nothing until mounted.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const selected = mounted ? (theme ?? "system") : null

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-border bg-muted p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={cn(
              "flex min-h-11 cursor-pointer flex-col items-start justify-center gap-1 rounded-xl px-3 py-2 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
              selected === value
                ? "bg-surface font-medium shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={selected === value}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
