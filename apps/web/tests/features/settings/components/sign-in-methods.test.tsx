import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SignInMethods } from "@/features/settings/components/sign-in-methods"

const { linkSocial, unlinkAccount, refresh } = vi.hoisted(() => ({
  linkSocial: vi.fn(),
  unlinkAccount: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: { linkSocial, unlinkAccount },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

function renderMethods(googleAccountId: string | null, linkedCount: number) {
  render(
    <SignInMethods
      email="ada@example.com"
      googleAccountId={googleAccountId}
      linkedCount={linkedCount}
    />
  )
}

describe("SignInMethods", () => {
  it("says the email link is always on", () => {
    renderMethods(null, 0)

    expect(
      screen.getByText(/one-time link to ada@example.com/)
    ).toBeInTheDocument()
  })

  it("connects Google and comes back to settings", async () => {
    linkSocial.mockResolvedValue({ data: {}, error: null })
    renderMethods(null, 1)

    await userEvent.click(screen.getByRole("button", { name: "Connect" }))

    expect(linkSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/settings",
      errorCallbackURL: "/settings",
    })
  })

  it("disconnects Google by account id and refreshes", async () => {
    unlinkAccount.mockResolvedValue({ data: {}, error: null })
    renderMethods("acc_1", 2)

    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }))

    expect(unlinkAccount).toHaveBeenCalledWith({ accountId: "acc_1" })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("offers no Disconnect for the only linked provider", () => {
    renderMethods("acc_1", 1)

    expect(screen.getByText("Only provider")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Disconnect" })
    ).not.toBeInTheDocument()
  })

  it("explains why the last provider can't be unlinked", async () => {
    unlinkAccount.mockResolvedValue({
      data: null,
      error: { status: 400, code: "FAILED_TO_UNLINK_LAST_ACCOUNT" },
    })
    renderMethods("acc_1", 2)

    await userEvent.click(screen.getByRole("button", { name: "Disconnect" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This is your only connected provider, so it can't be disconnected."
    )
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows the error when connecting fails", async () => {
    linkSocial.mockResolvedValue({ data: null, error: { status: 429 } })
    renderMethods(null, 1)

    await userEvent.click(screen.getByRole("button", { name: "Connect" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts. Wait a minute and try again."
    )
  })
})
