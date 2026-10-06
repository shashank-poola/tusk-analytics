import { Logo } from "@/components/brand/logo"

const FEATURES = [
  "One lightweight tracking script",
  "Revenue by traffic source",
  "Connects to Stripe, Polar, Paddle and more",
]

/** The light half of the sign-in page. Hidden on small screens. */
export function AuthShowcase() {
  return (
    <section className="hidden flex-1 flex-col bg-surface px-20 py-11 text-foreground lg:flex">
      <Logo />

      <div className="my-auto max-w-lg pb-11">
        <h1 className="text-[3.25rem] leading-[1.08] font-normal tracking-[-0.03em]">
          Know which traffic
          <br />
          turns into revenue.
        </h1>
        <p className="mt-7 text-[1.0625rem] leading-relaxed text-muted-foreground">
          Add one script. Viewtally counts your visitors and links every payment
          to the source that brought the customer in.
        </p>

        <ul className="mt-9 space-y-3.5 text-sm">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <CheckIcon />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-accent"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="m4.75 8.25 2 2 4.5-4.5"
        fill="none"
        stroke="var(--accent-foreground)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
