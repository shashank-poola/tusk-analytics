/** The pulsing green dot for live things: the only looping animation. */
export function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-live" />
    </span>
  )
}
