/** @jest-environment jsdom */
/**
 * BDD Suite: read-only rich text copy interaction.
 * Given: a saved copyButton in a TipTap document.
 * When: a reader presses its copy button.
 * Then: the clipboard receives the saved text and success is shown only after copying.
 */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TipTapContent } from "./index";
import { toast } from "sonner";

jest.mock("sonner", () => ({ toast: { info: jest.fn(), error: jest.fn() } }));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(" "),
}));

const value = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "copyButton", attrs: { text: "Saved copy value" } }],
    },
  ],
};

it("copies the saved value and confirms success", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<TipTapContent value={value} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy text" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith("Saved copy value"),
  );
  expect(
    await screen.findByRole("button", { name: "Text copied" }),
  ).toBeTruthy();
});

it("keeps the button available when clipboard access fails", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockRejectedValue(new Error("Denied")) },
  });
  render(<TipTapContent value={value} />);
  fireEvent.click(screen.getByRole("button", { name: "Copy text" }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to copy text to clipboard",
    ),
  );
  expect(screen.getByRole("button", { name: "Copy text" })).toBeTruthy();
});
