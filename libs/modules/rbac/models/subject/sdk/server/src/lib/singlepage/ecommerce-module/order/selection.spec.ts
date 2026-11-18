import { action } from "./selection";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

it("sends the same explicit selection and guards as the client with no-store request options", async () => {
  const request = jest.fn(async (_input: unknown, _options: RequestInit) =>
    Response.json({
      data: { quotes: [], orderIds: ["order"], applied: false },
    }),
  );
  global.fetch = request as unknown as typeof fetch;
  const data = {
    action: "apply" as const,
    lineId: "line",
    selections: [
      {
        offerId: "offer",
        quantity: 2,
        currencyId: "rub",
        destination: { address: "Fixture address" },
        services: [{ offerId: "assembly", quantity: 1 }],
      },
    ],
    expectedVersions: ["terms-1"],
    expectedSelectionUpdatedAt: "2026-11-17T00:00:00.000Z",
  };
  await action({
    id: "subject",
    orderId: "order",
    host: "http://api.test",
    data,
    options: {
      cache: "force-cache",
      next: { revalidate: 60 },
      headers: { Authorization: "Bearer fixture" },
    },
  });
  expect(request).toHaveBeenCalledWith(
    "http://api.test/api/rbac/subjects/subject/ecommerce-module/orders/order/selection",
    expect.objectContaining({
      method: "POST",
      cache: "no-store",
      credentials: "include",
      next: { revalidate: 0 },
      headers: { Authorization: "Bearer fixture" },
    }),
  );
  const options = request.mock.calls[0][1] as unknown as RequestInit;
  expect(JSON.parse(String((options.body as FormData).get("data")))).toEqual(
    data,
  );
});

it("does not issue a request without both Subject and Order IDs", async () => {
  const request = jest.fn();
  global.fetch = request as unknown as typeof fetch;
  await expect(
    action({
      id: "subject",
      orderId: "",
      data: { action: "preview", lineId: "line", selections: [] },
    }),
  ).rejects.toThrow("Subject and order IDs");
  expect(request).not.toHaveBeenCalled();
});
