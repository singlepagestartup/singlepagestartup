/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component } from "./ClientComponent";
const success = jest.fn();
jest.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => success(...args) },
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));

afterEach(() => {
  success.mockClear();
});

it("shows a success toast only after a successful save and keeps success out of the error area", async () => {
  const onSave = jest.fn().mockResolvedValue({});
  render(
    <Component
      isServer={false}
      variant="id-settings-ai-chat"
      data={{ id: "profile", title: { en: "Profile" }, slug: "profile" } as any}
      onSave={onSave}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() =>
    expect(success).toHaveBeenCalledWith(
      "Profile saved",
      expect.objectContaining({
        description: "Your profile changes have been saved.",
      }),
    ),
  );
  expect(success.mock.calls[0][1]).not.toHaveProperty("richColors");
  expect(success.mock.calls[0][1]).not.toHaveProperty("position");
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("keeps failed saves in the inline alert without a success toast", async () => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  render(
    <Component
      isServer={false}
      variant="id-settings-ai-chat"
      data={{ id: "profile", title: { en: "Profile" }, slug: "profile" } as any}
      onSave={async () => {
        throw new Error("Slug is already used");
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    expect.stringContaining("Slug is already used"),
  );
  expect(success).not.toHaveBeenCalled();
});
