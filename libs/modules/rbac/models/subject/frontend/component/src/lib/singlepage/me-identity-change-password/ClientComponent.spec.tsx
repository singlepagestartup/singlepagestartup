/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mockUpdate = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    identityUpdate: () => ({ isPending: false, mutateAsync: mockUpdate }),
  },
}));
import { Component } from "./ClientComponent";
function example() {
  render(
    <Component
      {...({
        isServer: false,
        variant: "me-identity-change-password",
        data: { id: "owner" },
        identity: { id: "identity" },
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Change password" }));
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: "old-test-password" },
  });
  fireEvent.change(screen.getByLabelText("New password", { exact: true }), {
    target: { value: "new-test-password" },
  });
}
beforeEach(() => {
  mockUpdate.mockReset();
  mockUpdate.mockResolvedValue({ id: "identity" });
});
it("does not submit a password until its repeated value matches", () => {
  example();
  fireEvent.change(screen.getByLabelText("Repeat new password"), {
    target: { value: "other-test-password" },
  });
  fireEvent.click(
    screen.getAllByRole("button", { name: "Change password" })[1],
  );
  expect(screen.getByRole("alert").textContent).toContain("do not match");
  expect(mockUpdate).not.toHaveBeenCalled();
});
it("sends only the current and new password to the owner's SDK after confirmation", async () => {
  example();
  fireEvent.change(screen.getByLabelText("Repeat new password"), {
    target: { value: "new-test-password" },
  });
  fireEvent.click(
    screen.getAllByRole("button", { name: "Change password" })[1],
  );
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe("Password updated."),
  );
  expect(mockUpdate).toHaveBeenCalledWith({
    id: "owner",
    identityId: "identity",
    data: { password: "old-test-password", newPassword: "new-test-password" },
  });
});
