/**
 * BDD Suite: payment-intent payment creation gate.
 *
 * Given: the payment-intent service decides which providers ALLOWED_BILLING_SERVICE_PROVIDERS allows.
 * When: a payment is created for a payment intent through a provider.
 * Then: a provider outside the list is refused with 400, and a listed provider creates its invoice as before.
 */

const mockPaymentIntentsToCurrenciesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    API_SERVICE_URL: "http://api.test",
    RBAC_SECRET_KEY: "test-rbac-secret",
  };
});

jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: { update: jest.fn() },
}));

jest.mock("@sps/billing/models/invoice/sdk/server", () => ({
  api: { create: jest.fn() },
}));

jest.mock(
  "@sps/billing/relations/payment-intents-to-invoices/sdk/server",
  () => ({
    api: { create: jest.fn() },
  }),
);

jest.mock(
  "@sps/billing/relations/payment-intents-to-currencies/sdk/server",
  () => ({
    api: {
      create: (...args: unknown[]) =>
        mockPaymentIntentsToCurrenciesCreate(...args),
    },
  }),
);

import { Hono } from "hono";
import { Handler } from "./index";

describe("Given: the payment-intent provider handler", () => {
  const paymentIntent = {
    id: "payment-intent-1",
    amount: 100,
    status: "requires_payment_method",
    type: "one_off",
  };

  function createService(props: { allowedProviders: string[] }) {
    return {
      isProviderAllowed: jest.fn((params: { provider: string }) => {
        return props.allowedProviders.includes(params.provider);
      }),
      findById: jest.fn().mockResolvedValue(paymentIntent),
      dummy: jest.fn(),
      billingModule: {
        currency: {
          findById: jest.fn().mockResolvedValue({
            id: "currency-1",
            slug: "usd",
          }),
        },
      },
    };
  }

  function createPayment(props: {
    service: ReturnType<typeof createService>;
    provider: string;
  }) {
    const app = new Hono();

    app.post("/:uuid/:provider", (c) => {
      return new Handler(props.service as any).execute(c, undefined);
    });

    const body = new FormData();
    body.set(
      "data",
      JSON.stringify({
        currencyId: "currency-1",
        metadata: { email: "buyer@example.com" },
      }),
    );

    return app.request(`/${paymentIntent.id}/${props.provider}`, {
      method: "POST",
      body,
    });
  }

  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockPaymentIntentsToCurrenciesCreate.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: {} })));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  /**
   * BDD Scenario
   *
   * Given: the list leaves dummy out.
   * When: a payment is created through dummy.
   * Then: it answers 400 and never reaches the dummy branch.
   */
  it("Then: refuses a provider the list leaves out", async () => {
    const service = createService({ allowedProviders: ["stripe"] });

    const response = await createPayment({ service, provider: "dummy" });

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain(
      "Provider dummy is not allowed",
    );
    expect(service.isProviderAllowed).toHaveBeenCalledWith({
      provider: "dummy",
    });
    expect(service.dummy).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   *
   * Given: the list names dummy.
   * When: a payment is created through dummy and ten seconds pass.
   * Then: it answers 201 with the dummy invoice and then posts the dummy webhook with the operator secret.
   */
  it("Then: creates the payment through the dummy branch when the list names dummy", async () => {
    jest.useFakeTimers({
      doNotFake: ["nextTick", "queueMicrotask", "setImmediate"],
    });
    const service = createService({ allowedProviders: ["dummy"] });
    const invoice = { id: "invoice-1", status: "open", provider: "dummy" };
    service.dummy.mockResolvedValue(invoice);

    const response = await createPayment({ service, provider: "dummy" });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: invoice });
    expect(service.dummy).toHaveBeenCalledWith({
      entity: paymentIntent,
      action: "create",
    });

    jest.advanceTimersByTime(10000);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/billing/payment-intents/dummy/webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        }),
        body: JSON.stringify({ data: { id: "invoice-1" } }),
      }),
    );
  });
});
