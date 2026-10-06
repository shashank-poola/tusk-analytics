import { cn } from "@workspace/ui/lib/utils"

// The profile banner of a site card: brand blues with Viewtally's tally
// marks as a faint texture. Each site gets one of a few variants, stable
// for its id, so cards are told apart at a glance.

const VARIANTS = [
  "linear-gradient(135deg, #1e61f0 0%, var(--chart-1) 100%)",
  "radial-gradient(circle at 85% 15%, var(--chart-1) 0%, transparent 55%), linear-gradient(160deg, #1e61f0 0%, #0b1b4d 100%)",
  "linear-gradient(120deg, #0b1b4d 0%, #1e61f0 55%, #b4cbfa 100%)",
  "radial-gradient(circle at 10% 90%, #b4cbfa 0%, transparent 45%), linear-gradient(200deg, #1e61f0 0%, #19284a 100%)",
] as const

/** A group of five tally marks, white, as a repeating tile. */
const TALLY_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.14"><path d="M14 18v20M20 18v20M26 18v20M32 18v20M10 34l26-12"/></g></svg>'
)}")`

function variantOf(siteId: string): string {
  let sum = 0
  for (const char of siteId) sum += char.charCodeAt(0)
  return VARIANTS[sum % VARIANTS.length] ?? VARIANTS[0]
}

type SiteBannerProps = { siteId: string; className?: string }

export function SiteBanner({ siteId, className }: SiteBannerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundImage: `${TALLY_TILE}, ${variantOf(siteId)}` }}
    >
      {/* A soft fade at the bottom so the overlapping icon sits on calm colour. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}
