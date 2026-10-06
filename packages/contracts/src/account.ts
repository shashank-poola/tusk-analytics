import * as z from "zod"

/** A person's display name, as edited on the settings page. */
export const USER_NAME_MAX_LENGTH = 80

export const userNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(
    USER_NAME_MAX_LENGTH,
    `Keep it under ${USER_NAME_MAX_LENGTH} characters.`
  )
