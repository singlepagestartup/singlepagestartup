import { Hono } from "hono";
import { Handler } from "./index";
import { logger } from "@sps/backend-utils";

const mockRetrieveEvent = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "fixture-secret",
  STRIPE_SECRET_KEY: "sk_test_fixture",
}));
jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  logger: { debug: jest.fn() },
}));
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    events: { retrieve: mockRetrieveEvent },
  })),
}));

function fixture() {
  const service = {
    isProviderAllowed: jest.fn().mockReturnValue(true),
    stripe: jest.fn().mockResolvedValue({
      id: "private-local-invoice",
      amount: 100,
      checkoutMetadata: { private: true },
    }),
    cloudpayments: jest.fn().mockResolvedValue({ code: 0 }),
    tiptoppay: jest.fn().mockResolvedValue({ code: 0 }),
    OxProcessing: jest.fn().mockResolvedValue({ id: "private-local-invoice" }),
    payselection: jest.fn().mockResolvedValue({ id: "private-local-invoice" }),
  };
  const app = new Hono();
  app.post("/:provider/webhook", (c) =>
    new Handler(service as any).execute(c, undefined),
  );
  const event = {
    id: "evt_fixture",
    object: "event",
    type: "invoice.paid",
    data: { object: { object: "invoice", id: "in_verified", status: "paid" } },
  };
  mockRetrieveEvent.mockResolvedValue(event);
  const post = (
    provider: string,
    body: unknown,
    headers: Record<string, string> = {},
  ) =>
    app.request(`/${provider}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  return { service, event, post };
}

beforeEach(() => jest.clearAllMocks());

it("uses only the API-retrieved Stripe event and acknowledges without returning local payment data", async () => {
  const f = fixture();
  const response = await f.post(
    "stripe",
    {
      id: "evt_fixture",
      data: { object: { id: "in_forged", status: "paid" } },
    },
    { Authorization: "sensitive" },
  );
  expect(response.status).toBe(200);
  expect(mockRetrieveEvent).toHaveBeenCalledWith("evt_fixture");
  expect(f.service.stripe).toHaveBeenCalledWith({
    action: "webhook",
    data: f.event,
  });
  await expect(response.json()).resolves.toEqual({ data: { received: true } });
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(logger.debug).not.toHaveBeenCalled();
});

it("acknowledges an authenticated unhandled event without running payment settlement", async () => {
  const f = fixture();
  mockRetrieveEvent.mockResolvedValue({
    ...f.event,
    type: "customer.subscription.updated",
    data: { object: { object: "subscription", id: "sub_verified" } },
  });
  const response = await f.post("stripe", { id: "evt_fixture" });
  expect(response.status).toBe(200);
  expect(f.service.stripe).not.toHaveBeenCalled();
  await expect(response.json()).resolves.toEqual({ data: { received: true } });
});

it.each([{}, { id: 17 }, { id: "in_123" }])(
  "rejects a malformed event identifier before any provider request",
  async (body) => {
    const f = fixture();
    const response = await f.post("stripe", body);
    expect(response.status).toBe(400);
    expect(mockRetrieveEvent).not.toHaveBeenCalled();
    expect(f.service.stripe).not.toHaveBeenCalled();
  },
);

it.each([{ id: "evt_other" }, { object: "invoice" }, { data: null }])(
  "rejects an invalid or mismatched retrieved event",
  async (change) => {
    const f = fixture();
    mockRetrieveEvent.mockResolvedValue({ ...f.event, ...change });
    const response = await f.post("stripe", { id: "evt_fixture" });
    expect(response.status).toBe(400);
    expect(f.service.stripe).not.toHaveBeenCalled();
  },
);

it("keeps an out-of-order provider receipt retryable without a success acknowledgment", async () => {
  const f = fixture();
  f.service.stripe.mockRejectedValueOnce(
    new Error("Conflict error. Previous period is missing"),
  );
  const response = await f.post("stripe", { id: "evt_fixture" });
  expect(response.status).toBe(409);
  expect(await response.text()).not.toContain("private-local-invoice");
});

it.each(["cloudpayments", "tiptoppay"])(
  "returns the documented %s acknowledgment after signature verification",
  async (provider) => {
    const f = fixture();
    const response = await f.post(
      provider,
      { Amount: "100", Status: "Completed" },
      {
        "x-content-hmac": "verified-by-service",
        "content-hmac": "verified-by-service",
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ code: 0 });
    expect((f.service as any)[provider]).toHaveBeenCalled();
    expect(logger.debug).not.toHaveBeenCalled();
  },
);

it.each(["cloudpayments", "tiptoppay"])(
  "does not acknowledge an unsigned %s callback",
  async (provider) => {
    const f = fixture();
    const response = await f.post(provider, {
      Amount: "100",
      Status: "Completed",
    });
    expect(response.status).toBe(403);
    expect((f.service as any)[provider]).not.toHaveBeenCalled();
  },
);

it.each(["0xprocessing", "payselection"])(
  "does not expose local payment data after processing %s",
  async (provider) => {
    const f = fixture();
    const response = await f.post(
      provider,
      { provider: "verified-by-service" },
      { "x-site-id": "site", "x-webhook-signature": "verified-by-service" },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
  },
);
