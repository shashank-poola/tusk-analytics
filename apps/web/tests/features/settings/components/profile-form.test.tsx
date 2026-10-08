import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ProfileForm } from "@/features/settings/components/profile-form"

const { updateUser, refresh } = vi.hoisted(() => ({
  updateUser: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({ authClient: { updateUser } }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

function renderForm() {
  render(
    <ProfileForm
      name="Ada Lovelace"
      email="ada@example.com"
      avatarSrc="data:image/svg+xml;base64,AA=="
      hasProviderPhoto={false}
    />
  )
  return screen.getByLabelText("Name")
}

describe("ProfileForm", () => {
  it("shows the name and the email that can't be edited", () => {
    const input = renderForm()

    expect(input).toHaveValue("Ada Lovelace")
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()
  })

  it("keeps Save disabled until the name changes", async () => {
    const input = renderForm()
    const save = screen.getByRole("button", { name: "Save changes" })
    expect(save).toBeDisabled()

    await userEvent.type(input, "!")
    expect(save).toBeEnabled()

    await userEvent.type(input, "{Backspace}")
    expect(save).toBeDisabled()
  })

  it("saves the trimmed name, says so and refreshes the header", async () => {
    updateUser.mockResolvedValue({ data: {}, error: null })
    const input = renderForm()

    await userEvent.clear(input)
    await userEvent.type(input, "  Grace Hopper  ")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(updateUser).toHaveBeenCalledWith({ name: "Grace Hopper" })
    expect(await screen.findByText("Saved.")).toBeInTheDocument()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("asks for a name without calling the API when it is empty", async () => {
    const input = renderForm()

    await userEvent.clear(input)
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter your name.")
    expect(updateUser).not.toHaveBeenCalled()
  })

  it("shows the mapped message when saving fails", async () => {
    updateUser.mockResolvedValue({
      data: null,
      error: { status: 400, code: "INVALID_NAME" },
    })
    const input = renderForm()

    await userEvent.type(input, "!")
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a name of up to 80 characters."
    )
    expect(screen.queryByText("Saved.")).not.toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })
})
