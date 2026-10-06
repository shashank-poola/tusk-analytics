import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignIn } from "@/features/auth/components/sign-in"

const { social, magicLink } = vi.hoisted(() => ({
  social: vi.fn(),
  magicLink: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { social, magicLink } },
}))

const REDIRECTS = { callbackURL: "/dashboard", errorCallbackURL: "/signup" }

describe("SignIn", () => {
  it("starts Google sign-in", async () => {
    social.mockResolvedValue({ data: {}, error: null })
    render(<SignIn />)

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" })
    )

    expect(social).toHaveBeenCalledWith({ provider: "google", ...REDIRECTS })
  })

  it("sends a magic link and says where it went", async () => {
    magicLink.mockResolvedValue({ data: { status: true }, error: null })
    render(<SignIn />)

    await userEvent.type(
      screen.getByLabelText("Email address"),
      "ada@example.com"
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    expect(magicLink).toHaveBeenCalledWith({
      email: "ada@example.com",
      ...REDIRECTS,
    })
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: "Use a different email" })
    )
    expect(screen.getByLabelText("Email address")).toBeInTheDocument()
  })

  it("explains when sign-in is rate limited", async () => {
    magicLink.mockResolvedValue({ data: null, error: { status: 429 } })
    render(<SignIn />)

    await userEvent.type(
      screen.getByLabelText("Email address"),
      "ada@example.com"
    )
    await userEvent.click(
      screen.getByRole("button", { name: "Continue with email" })
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Too many attempts")
  })

  it("shows the error Better Auth redirected back with", () => {
    render(<SignIn errorCode="EXPIRED_TOKEN" />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "That sign-in link has expired"
    )
  })

  it("falls back to a generic message for unknown error codes", () => {
    render(<SignIn errorCode="something_new" />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sign-in failed. Please try again."
    )
  })
})
