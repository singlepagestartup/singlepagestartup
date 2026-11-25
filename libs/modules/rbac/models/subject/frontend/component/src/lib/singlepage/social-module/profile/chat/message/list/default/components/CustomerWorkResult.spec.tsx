/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatResultFile, CustomerWorkResult } from "./CustomerWorkResult";

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

const older = { id: "preview", legacyMessageId: "old-result" };
const newer = { id: "new" };

it("opens the original from the accepted file's message only after delivery", () => {
  const client = new QueryClient();
  const loadArtifact = jest.fn();
  const row = (delivered: boolean, fileId = "preview") => (
    <QueryClientProvider client={client}>
      <ChatResultFile
        fileId={fileId}
        language="en"
        source={{
          loadArtifact,
          work: {
            orderId: "order",
            storeId: "store",
            taskId: "task",
            state: delivered ? "delivered" : "paid",
            paidFileId: "preview",
            acceptedFileId: "preview",
            deliveryStatus: delivered ? "available" : "pending",
            receipt: null,
            trackingNumber: null,
            files: [
              {
                id: "preview",
                createdAt: "",
                price: "2",
                currencyId: "currency",
                preview: { id: "preview", path: "/preview" },
                previewMimeType: "image/jpeg",
                name: "preview.jpg",
              },
            ],
            result: {
              id: "original",
              path: "/protected",
              name: "cover.png",
              mimeType: "image/png",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
  const { rerender, unmount } = render(row(false));
  expect(
    screen.getByRole("button", { name: "Preview preview.jpg" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Preview cover.png" }),
  ).toBeNull();
  rerender(row(true));
  expect(
    screen.getByRole("button", { name: "Preview cover.png" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Preview preview.jpg" }),
  ).toBeNull();
  rerender(row(false, "original"));
  expect(
    screen.queryByRole("button", { name: "Preview cover.png" }),
  ).toBeNull();
  rerender(row(true, "original"));
  expect(
    screen.getByRole("button", { name: "Preview cover.png" }),
  ).toBeTruthy();
  unmount();
  client.clear();
});

it("does not expose a result or controls for an unknown attachment", () => {
  mockOrder.mockReturnValue({ data: { files: [older, newer] } });
  const { container } = render(
    <CustomerWorkResult
      subjectId="buyer"
      threadId="thread"
      fileId="unrelated"
      language="en"
    />,
  );
  expect(container.firstChild).toBeNull();
});

it("shows the private preview from a legacy chat message without a version selector", async () => {
  const queryClient = new QueryClient();
  const loadArtifact = jest.fn().mockResolvedValue(
    new Blob([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)], {
      type: "image/png",
    }),
  );
  const createObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "createObjectURL",
  );
  const revokeObjectURL = Object.getOwnPropertyDescriptor(
    URL,
    "revokeObjectURL",
  );
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:authorized-preview"),
  });
  const revoke = jest.fn();
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  try {
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <ChatResultFile
          source={{
            loadArtifact,
            work: {
              orderId: "order",
              taskId: "task",
              storeId: "store",
              state: "delivered",
              acceptedFileId: newer.id,
              paidFileId: newer.id,
              files: [
                {
                  ...older,
                  createdAt: new Date().toISOString(),
                  price: "5",
                  currencyId: "currency",
                  preview: { id: "preview", path: "/artifact" },
                  previewMimeType: "image/png",
                  invalidatedByCartEdit: true,
                },
              ],
              result: null,
              receipt: null,
              deliveryStatus: "available",
              trackingNumber: null,
            },
          }}
          fileId={older.legacyMessageId}
          language="en"
        />
      </QueryClientProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Preview Order file preview" }),
    );
    const image = await screen.findByRole("img", {
      name: "Order file preview",
    });
    expect(image.getAttribute("src")).toBe("blob:authorized-preview");
    expect(loadArtifact).toHaveBeenCalledWith(
      "preview",
      expect.any(AbortSignal),
      undefined,
    );
    expect(screen.queryByRole("button", { name: /version/i })).toBeNull();
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:authorized-preview");
  } finally {
    if (createObjectURL) {
      Object.defineProperty(URL, "createObjectURL", createObjectURL);
    } else {
      Reflect.deleteProperty(URL, "createObjectURL");
    }
    if (revokeObjectURL) {
      Object.defineProperty(URL, "revokeObjectURL", revokeObjectURL);
    } else {
      Reflect.deleteProperty(URL, "revokeObjectURL");
    }
    queryClient.clear();
  }
});
