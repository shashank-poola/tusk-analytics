import { cn } from "@workspace/ui/lib/utils"

const STEPS = 3

/**
 * Three short bars over the onboarding card: add the site, install, first
 * visit. No step names on screen; screen readers hear the position.
 */
export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={1}
      aria-valuemax={STEPS}
      aria-valuenow={step}
      aria-valuetext={`Step ${step} of ${STEPS}`}
      className="flex gap-1.5"
    >
      {Array.from({ length: STEPS }, (_, index) => (
        <span
          // Fixed length and order: the index is the step.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            index < step ? "bg-accent" : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}
