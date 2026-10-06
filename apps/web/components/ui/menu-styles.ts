// Kept out of menu.tsx: a "use client" module only exports client references
// to server components, so a server component importing a string from it
// would get a reference instead of the classes.

/** A row in a Menu, for links and buttons alike. */
export const MENU_ITEM_CLASSES =
  "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-muted sm:min-h-9"
