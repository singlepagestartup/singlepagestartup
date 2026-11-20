/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { CustomerWorkResult } from "./CustomerWorkResult";

const mockOrder = jest.fn();

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkForThread: () => ({
      data: { orderId: "order", storeId: "store", taskId: "task" },
    }),
    orderWork: {
      read: (...args: unknown[]) => mockOrder(...args),
    },
  },
}));

const older = { id: "older", number: 1 };
const newer = { id: "newer", number: 2 };
const scope = {
  subjectId: "buyer",
  threadId: "work-thread",
  language: "en",
  versionId: older.id,
};

it("opens the version named in the message, even after a newer version arrives", () => {
  mockOrder.mockReturnValue({ data: { versions: [older, newer] } });
  const onReview = jest.fn();
  render(<CustomerWorkResult {...scope} onReview={onReview} />);

  fireEvent.click(screen.getByRole("button", { name: "Open version 1" }));

  expect(onReview).toHaveBeenCalledWith(older.id);
  expect(screen.queryByRole("button", { name: /accept/i })).toBeNull();
});

it("keeps versions invalidated by a cart edit visible as history", () => {
  mockOrder.mockReturnValue({
    data: { versions: [{ ...older, invalidatedByCartEdit: true }, newer] },
  });
  render(<CustomerWorkResult {...scope} onReview={jest.fn()} />);

  expect(
    screen.getByText("Version 1 is from before the quantity change."),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Open version 1" })).toBeNull();
});
