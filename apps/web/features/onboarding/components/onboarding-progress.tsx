import { cn } from "@workspace/ui/lib/utils"

const STEPS = ["Add your site", "Install the script"] as const

/** Two bars over the onboarding card, each named; done and current fill blue. */
export function OnboardingProgress({ step }: { step: 1 | 2 }) {
  return (
    <ol aria-label="Setup progress" className="grid w-full grid-cols-2 gap-3">
      {STEPS.map((label, index) => {
        const reached = index < step
        const current = index === step - 1
        return (
          <li key={label} aria-current={current ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={cn(
                "block h-1.5 rounded-full transition-colors",
                reached ? "bg-accent" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "mt-2 block text-[13px] font-semibold",
                current ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
