import { Hono } from "hono";
import { Handler } from "./index";

const quote = jest.fn();
const uuid = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const app = new Hono();
app.post("/:uuid/quote", (c) => new Handler({ quote } as any).execute(c));
beforeEach(() => quote.mockReset().mockResolvedValue({ amount: "10.00" }));

it("accepts and strips legacy pickup-point data before invoking the quote service", async () => {
  const response = await app.request(`/${uuid}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quantity: 1,
      currencyId: uuid,
      destination: {
        address: "Shipping address",
        pickupPointId: "retired-point",
      },
    }),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(quote.mock.calls[0][0].destination.address).toBe("Shipping address");
  expect(quote.mock.calls[0][0].destination).not.toHaveProperty(
    "pickupPointId",
  );
});

it("keeps destination validation strict for unsupported fields", async () => {
  const response = await app.request(`/${uuid}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quantity: 1,
      currencyId: uuid,
      destination: { collectionStoreId: "buyer-supplied-store" },
    }),
  });
  expect(response.status).toBe(400);
  expect(quote).not.toHaveBeenCalled();
});
