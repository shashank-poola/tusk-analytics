import { DemoDashboard } from "./demo/demo-dashboard"
import { DomainStart } from "./domain-start"

/**
 * Centered headline, the domain field, then the interactive demo below.
 * No mascot here: the demo is the picture.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-background pt-14 pb-16 sm:pt-24 sm:pb-20"
    >
      <div className="mx-auto w-full max-w-[70rem] px-4 text-center sm:px-6">
        <h1
          id="hero-title"
          className="mx-auto max-w-3xl text-[2.5rem] leading-[1.05] text-balance sm:text-[3.5rem]"
        >
          See the people behind your pageviews.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-normal text-pretty text-muted-foreground sm:text-xl">
          Know who&apos;s on your site right now and where they came from. Every
          visitor gets a name.
        </p>

        <DomainStart />
      </div>

      {/* Wider than the text column: the demo is the hero's picture. */}
      <div
        id="demo"
        className="mx-auto mt-14 w-full max-w-[77rem] scroll-mt-24 px-4 sm:mt-20 sm:px-6"
      >
        <DemoDashboard />
      </div>
    </section>
  )
}
