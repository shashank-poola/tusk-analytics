"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { deleteFunnelAction } from "@/features/analytics/server/funnel-actions"

type DeleteFunnelButtonProps = {
  siteId: string
  funnel: { id: string; name: string }
  className: string
}

/** Deletes the funnel on screen after a confirm, then shows the first one left. */
export function DeleteFunnelButton({
  siteId,
  funnel,
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
          const search = new URLSearchParams(window.location.search)
          search.delete("funnel")
          router.push(`?${search}`, { scroll: false })
        })
      }}
    >
      <Trash2 aria-hidden="true" className="size-4" />
    </button>
  )
}
