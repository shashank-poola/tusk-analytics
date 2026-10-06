/** True while the user types in a field, where single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

/** A plain key press: no modifier, not held down, not already handled. */
export function isPlainKeyPress(event: KeyboardEvent): boolean {
  return (
    !event.defaultPrevented &&
    !event.repeat &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isTypingTarget(event.target)
  )
}
