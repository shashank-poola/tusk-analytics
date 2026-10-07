"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
  FUNNEL_MAX_STEPS,
  FUNNEL_MIN_STEPS,
  type FunnelStep,
} from "@workspace/contracts"
import { Plus, Trash2, X } from "lucide-react"
import { useId, useRef, useState, useTransition } from "react"

import { BUTTON_CLASSES, INPUT_CLASSES } from "@/components/ui/button-styles"
import { useSetView } from "@/features/analytics/hooks/use-set-view"
import { createFunnelAction } from "@/features/analytics/server/funnel-actions"
import { routes } from "@/lib/routes"

type Draft = { type: FunnelStep["type"]; value: string }

type NewFunnelDialogProps = {
  siteId: string
  /** Suggestions for page steps: the site's top paths. */
  pages: string[]
  /** Suggestions for goal steps: the goals seen in the period. */
  goals: string[]
  /** The current view as `viewSearch` writes it, kept when the new funnel opens. */
  view: Record<string, string>
  /** Classes for the button that opens the dialog. */
  triggerClassName: string
}

const FIELD_CLASSES = cn(INPUT_CLASSES, "w-auto px-2.5 text-sm")

/**
 * "New funnel": a name and 2–8 steps, each a page or a goal, saved through
 * a server action that validates again. Opens the new funnel on success.
 */
export function NewFunnelDialog({
  siteId,
  pages,
  goals,
  view,
  triggerClassName,
}: NewFunnelDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { setView } = useSetView()
  const id = useId()
  const [name, setName] = useState("")
  const [steps, setSteps] = useState<Draft[]>([
    { type: "page", value: "/" },
    { type: "page", value: "" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  function update(index: number, change: Partial<Draft>) {
    setSteps((current) =>
      current.map((step, at) => (at === index ? { ...step, ...change } : step))
    )
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    startSaving(async () => {
      const result = await createFunnelAction(siteId, { name, steps })
      if (!result.ok) {
        setError(result.error)
        return
      }
      dialogRef.current?.close()
      setView(
        routes.site(siteId, {
          ...view,
          insights: "funnel",
          funnel: result.funnelId,
        })
      )
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={triggerClassName}
      >
        <Plus aria-hidden="true" className="size-4" />
        New funnel
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[1.25rem] border-2 border-border bg-surface p-0 text-foreground shadow-pop backdrop:bg-foreground/30 backdrop:backdrop-blur-[2px] open:animate-rise"
      >
        <form onSubmit={save} className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 id={`${id}-title`} className="text-lg leading-snug">
              New funnel
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="inline-grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted sm:size-8"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Name</span>
            <input
              required
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Signup"
              className={cn(FIELD_CLASSES, "w-full")}
            />
          </label>
          <ol className="space-y-2">
            {steps.map((step, index) => (
              // Steps have no id of their own; their position is their identity.
              // eslint-disable-next-line react/no-array-index-key
              <li key={index} className="flex items-center gap-2">
                <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <select
                  aria-label={`Step ${index + 1} kind`}
                  value={step.type}
                  onChange={(event) =>
                    update(index, {
                      type: event.target.value === "goal" ? "goal" : "page",
                    })
                  }
                  className={FIELD_CLASSES}
                >
                  <option value="page">Page</option>
                  <option value="goal">Goal</option>
                </select>
                <input
                  required
                  aria-label={`Step ${index + 1} ${step.type === "page" ? "path" : "goal name"}`}
                  list={`${id}-${step.type}s`}
                  value={step.value}
                  onChange={(event) =>
                    update(index, { value: event.target.value })
                  }
                  placeholder={step.type === "page" ? "/pricing" : "signup"}
                  className={cn(FIELD_CLASSES, "min-w-0 flex-1")}
                />
                <button
                  type="button"
                  disabled={steps.length <= FUNNEL_MIN_STEPS}
                  onClick={() =>
                    setSteps((current) =>
                      current.filter((_, at) => at !== index)
                    )
                  }
                  aria-label={`Remove step ${index + 1}`}
                  className="inline-grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 sm:size-8"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <datalist id={`${id}-pages`}>
            {pages.map((page) => (
              <option key={page} value={page} />
            ))}
          </datalist>
          <datalist id={`${id}-goals`}>
            {goals.map((goal) => (
              <option key={goal} value={goal} />
            ))}
          </datalist>
          {steps.length < FUNNEL_MAX_STEPS && (
            <button
              type="button"
              onClick={() =>
                setSteps((current) => [...current, { type: "page", value: "" }])
              }
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:text-foreground sm:min-h-8"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add a step
            </button>
          )}
          {error && (
            <p
              role="alert"
              className="text-sm whitespace-pre-line text-negative"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={BUTTON_CLASSES.primary}
            >
              {saving ? "Saving…" : "Save funnel"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
