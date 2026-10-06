"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"

import { useSetView } from "@/features/analytics/hooks/use-set-view"
import { deleteFunnelAction } from "@/features/analytics/server/funnel-actions"
import { routes } from "@/lib/routes"

type DeleteFunnelButtonProps = {
  siteId: string
  funnel: { id: string; name: string }
  /** The current view without a chosen funnel, as `viewSearch` writes it. */
  viewWithoutFunnel: Record<string, string>
  className: string
}

/** Deletes the funnel on screen after a confirm, then shows the first one left. */
export function DeleteFunnelButton({
  siteId,
  funnel,
  viewWithoutFunnel,
  className,
}: DeleteFunnelButtonProps) {
  const { setView } = useSetView()
  const [deleting, startDeleting] = useTransition()
  return (
    <button
      type="button"
      disabled={deleting}
      aria-label={`Delete funnel ${funnel.name}`}
      title="Delete funnel"
      className={className}
      onClick={() => {
        if (!window.confirm(`Delete the funnel "${funnel.name}"?`)) return
        startDeleting(async () => {
          const result = await deleteFunnelAction(siteId, funnel.id)
          if (!result.ok) {
            window.alert(result.error ?? "Couldn't delete the funnel.")
            return
          }
          setView(routes.site(siteId, viewWithoutFunnel))
        })
      }}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}
