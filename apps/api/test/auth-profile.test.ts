import { USER_NAME_MAX_LENGTH } from "@workspace/contracts"
import { createDb, eq, user } from "@workspace/db"
import { env } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

import { app } from "../src/app"
import { randomIp, signIn } from "./helpers"

function updateUser(cookie: string, body: unknown) {
  return app.request(
    "/api/auth/update-user",
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "application/json",
        Origin: env.BETTER_AUTH_URL,
        "cf-connecting-ip": randomIp(),
      },
      body: JSON.stringify(body),
    },
    env
  )
}

async function stored(userId: string) {
  const [row] = await createDb(env.DB)
    .select({ name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, userId))
  if (!row) throw new Error("User not found")
  return row
}

async function storedName(userId: string) {
  return (await stored(userId)).name
}

describe("POST /api/auth/update-user", () => {
  it("rejects a name over the maximum length with INVALID_NAME", async () => {
    const { cookie, userId } = await signIn()
    const before = await storedName(userId)

    const res = await updateUser(cookie, {
      name: "a".repeat(USER_NAME_MAX_LENGTH + 1),
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      code: "INVALID_NAME",
      message: `Keep it under ${USER_NAME_MAX_LENGTH} characters.`,
    })
    expect(await storedName(userId)).toBe(before)
  })

  it("rejects a name that is only whitespace", async () => {
    const { cookie, userId } = await signIn()
    const before = await storedName(userId)

    const res = await updateUser(cookie, { name: "   " })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      code: "INVALID_NAME",
      message: "Enter your name.",
    })
    expect(await storedName(userId)).toBe(before)
  })

  it("stores the name trimmed", async () => {
    const { cookie, userId } = await signIn()

    const res = await updateUser(cookie, { name: "  Ada  " })

    expect(res.status).toBe(200)
    expect(await storedName(userId)).toBe("Ada")
  })
})

describe("POST /api/auth/update-user with an image", () => {
  const AVATAR = "https://images.example.com/avatar.png"

  it.each([
    ["a javascript: URL", "javascript:alert(1)", "Use an https:// image URL."],
    ["a data: URL", "data:image/png;base64,AAAA", "Use an https:// image URL."],
    [
      "an http URL",
      "http://images.example.com/a.png",
      "Use an https:// image URL.",
    ],
    [
      "an https URL over 2048 characters",
      `https://images.example.com/${"a".repeat(2048)}.png`,
      "Keep the image URL under 2048 characters.",
    ],
  ])("rejects %s with INVALID_IMAGE", async (_, image, message) => {
    const { cookie, userId } = await signIn()
    const before = await stored(userId)

    const res = await updateUser(cookie, { image })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "INVALID_IMAGE", message })
    expect(await stored(userId)).toEqual(before)
  })

  it("stores an https image URL", async () => {
    const { cookie, userId } = await signIn()

    const res = await updateUser(cookie, { image: AVATAR })

    expect(res.status).toBe(200)
    expect((await stored(userId)).image).toBe(AVATAR)
  })

  it("removes the image when it is set to null", async () => {
    const { cookie, userId } = await signIn()
    await updateUser(cookie, { image: AVATAR })

    const res = await updateUser(cookie, { image: null })

    expect(res.status).toBe(200)
    expect((await stored(userId)).image).toBeNull()
  })
})
