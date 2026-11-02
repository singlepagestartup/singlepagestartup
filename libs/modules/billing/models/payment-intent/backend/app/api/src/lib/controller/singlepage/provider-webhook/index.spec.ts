/**
 * BDD Suite: provider-specific PayKeeper webhook response and authorization ordering.
 * Given: a PayKeeper notification or a crafted legacy zero-invoice envelope.
 * When: the provider router dispatches it.
 * Then: PayKeeper authentication precedes every legacy invoice path and its successful answer is plain text.
 */
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-rbac-secret",
}));
jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  logger: { debug: jest.fn() },
}));
import { Hono } from "hono";
import { logger } from "@sps/backend-utils";
import { Handler } from "./index";

function fixture() {
  const service = {
    paykeeper: jest
      .fn()
      .mockResolvedValue({ ok: true, acknowledgment: "OK fixed-digest" }),
    billingModule: {
      invoice: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: "zero-invoice", amount: 0 }),
      },
    },
    updatePaymentIntentStatus: jest.fn(),
  };
  const app = new Hono();
  app.post("/:provider/webhook", (c) =>
    new Handler(service as any).execute(c, jest.fn()),
  );
  return { service, app };
}
beforeEach(() => jest.clearAllMocks());

it("returns the exact text acknowledgment after successful service processing", async () => {
  const f = fixture();
  const response = await f.app.request("/paykeeper/webhook", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "id=301&sum=100.00",
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/plain");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-robots-tag")).toBe("noindex");
  expect(await response.text()).toBe("OK fixed-digest");
  expect(logger.debug).not.toHaveBeenCalled();
});

it("does not let a zero-amount envelope bypass PayKeeper authentication", async () => {
  const f = fixture();
  f.service.paykeeper.mockRejectedValue(
    new Error("Permission error. Invalid PayKeeper webhook signature"),
  );
  const response = await f.app.request("/paykeeper/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: { id: "zero-invoice" } }),
  });
  expect(response.status).toBe(403);
  expect(f.service.billingModule.invoice.findById).not.toHaveBeenCalled();
  expect(f.service.updatePaymentIntentStatus).not.toHaveBeenCalled();
});

it("reports malformed JSON as 400 without invoking the service", async () => {
  const f = fixture();
  const response = await f.app.request("/paykeeper/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  expect(response.status).toBe(400);
  expect(f.service.paykeeper).not.toHaveBeenCalled();
});
