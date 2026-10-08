// Kept out of any "use client" module so server components can import the
// strings (see menu-styles.ts).

// The bottom edge is a box shadow, not a border, so nothing around the
// button moves. Hover lifts it 2 px and grows the edge by 2 px (its bottom
// stays put); pressing sinks it 4 px and drops the edge.
const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base leading-tight font-semibold transition-[translate,box-shadow,background-color,color,border-color] duration-[120ms] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-60"

/** Tusk's chunky buttons. Use them for actions only, never for chrome. */
export const BUTTON_CLASSES = {
  primary: `${BASE} bg-button text-white shadow-[0_4px_0_var(--button-edge)] hover:bg-button-hover hover:shadow-[0_6px_0_var(--button-edge)]`,
  secondary: `${BASE} border-2 border-border bg-surface text-muted-foreground shadow-[0_4px_0_var(--border)] hover:border-accent/50 hover:text-foreground hover:shadow-[0_6px_0_color-mix(in_oklab,var(--accent)_50%,var(--border))]`,
  danger: `${BASE} bg-negative text-white shadow-[0_4px_0_var(--danger-edge)] hover:brightness-95 hover:shadow-[0_6px_0_var(--danger-edge)]`,
} as const

/** Text fields and selects: 2 px border, Tusk Blue focus with a Foam ring. */
export const INPUT_CLASSES =
  "h-11 w-full rounded-xl border-2 border-border bg-surface px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-3 focus:ring-accent-soft focus:outline-none"
