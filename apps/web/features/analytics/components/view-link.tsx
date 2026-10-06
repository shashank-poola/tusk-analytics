import Link from "next/link"
import type { ComponentProps } from "react"

/**
 * A link that sets the dashboard's view (`routes.site(id, search)`). It
 * never prefetches: the proxy turns such a request into a cookie change,
 * which must only happen when the link is clicked.
 */
export function ViewLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />
}
