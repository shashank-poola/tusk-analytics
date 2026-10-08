import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"

// Where indie hackers and developers hang out, mixed. Logos only, in brand
// colours, from public/spots (Simple Icons, CC0; TrustMRR traced from its
// icon). The near-black ones flip to light in dark mode.
const SPOTS = [
  { file: "indiehackers", name: "Indie Hackers", dark: true },
  { file: "hackernews", name: "Hacker News" },
  { file: "producthunt", name: "Product Hunt" },
  { file: "github", name: "GitHub", dark: true },
  { file: "peerlist", name: "Peerlist" },
  { file: "devdotto", name: "dev.to", dark: true },
  { file: "trustmrr", name: "TrustMRR" },
  { file: "reddit", name: "Reddit" },
  { file: "x", name: "X", dark: true },
  { file: "dailydotdev", name: "daily.dev" },
] as const

/**
 * "Built for indie hackers and developers from" and a row of logos sliding
 * right to left, fading out at both edges. Hover pauses it; with reduced
 * motion it stands still.
 */
export function SpotsMarquee() {
  return (
    <section
      aria-labelledby="spots-title"
      className="bg-background pb-16 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-[70rem] px-4 sm:px-6">
        <h2
          id="spots-title"
          className="text-center font-sans text-[15px] font-medium text-muted-foreground"
        >
          Built for indie hackers and developers from
        </h2>
        {/* The mask fades the logos out at both edges. */}
        <div className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          {/* Two copies back to back; sliding by half loops seamlessly. */}
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            <SpotList />
            <SpotList hidden />
          </div>
        </div>
      </div>
    </section>
  )
}

function SpotList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-14 pr-14 sm:gap-20 sm:pr-20"
    >
      {SPOTS.map((spot) => (
        <li key={spot.file}>
          <Image
            src={`/spots/${spot.file}.svg`}
            alt={hidden ? "" : spot.name}
            title={spot.name}
            width={36}
            height={36}
            className={cn("size-8 sm:size-9", "dark" in spot && "dark:invert")}
          />
        </li>
      ))}
    </ul>
  )
}
