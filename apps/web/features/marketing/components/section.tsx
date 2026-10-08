import { cn } from "@workspace/ui/lib/utils"

// An alt band fades into its neighbours above and below instead of meeting
// them at a hard edge: two soft colour ramps hanging outside the band, as
// tall as a section's padding so they never cover a neighbour's content.
const ALT_FADES =
  "relative before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-16 sm:before:h-24 before:bg-linear-to-b before:from-transparent before:to-section-alt after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-16 sm:after:h-24 after:bg-linear-to-t after:from-transparent after:to-section-alt"

const TONES = {
  page: "bg-background",
  alt: `bg-section-alt ${ALT_FADES}`,
} as const

type SectionProps = {
  /** Backgrounds alternate page / alt; alt bands blend into their neighbours. */
  tone: keyof typeof TONES
  id?: string
  /** Names the landmark when the section has no visible heading. */
  label?: string
  labelledBy?: string
  className?: string
  children: React.ReactNode
}

/** A full-width landing band with the 1120 px container inside. */
export function Section({
  tone,
  id,
  label,
  labelledBy,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn("scroll-mt-16 py-16 sm:py-24", TONES[tone])}
    >
      <div
        className={cn("mx-auto w-full max-w-[70rem] px-4 sm:px-6", className)}
      >
        {children}
      </div>
    </section>
  )
}

/** Section headings: Feather Bold, 32 px on phones, 40 px from `sm`. */
export const SECTION_HEADING_CLASSES =
  "text-[2rem] leading-[1.1] text-balance sm:text-[2.5rem]"

/** A small pill: "Free during beta", "Coming soon". */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-link">
      {children}
    </span>
  )
}
