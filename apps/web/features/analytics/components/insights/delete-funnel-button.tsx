"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

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
  const router = useRouter()
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
          router.push(routes.site(siteId, viewWithoutFunnel), {
            scroll: false,
          })
        })
      }}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}
