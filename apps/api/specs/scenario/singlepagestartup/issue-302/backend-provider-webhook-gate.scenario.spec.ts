/**
 * BDD Suite: issue-302 provider webhook gate with real API and database.
 *
 * Given: API server and database run from apps/api/.env with the same ALLOWED_BILLING_SERVICE_PROVIDERS as this process, and a zero-amount invoice is linked to a payment intent.
 * When: the provider webhook is posted with the operator secret, as the API's own webhook calls are, first for a provider outside the list and then for a listed one.
 * Then: the unlisted provider is refused with 400 and both rows stay unpaid; the listed provider settles the invoice and the payment intent.
 */

import { ALLOWED_BILLING_SERVICE_PROVIDERS } from "@sps/shared-utils";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as paymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { getApiUrl, getRequiredEnv } from "../issue-154/test-utils/env";

describe("Given: issue-302 provider webhook gate scenario", () => {
  const cleanupTasks: Array<() => Promise<unknown>> = [];

  const secretHeaders = () => {
    return {
      "X-RBAC-SECRET-KEY": getRequiredEnv("RBAC_SECRET_KEY"),
      "Cache-Control": "no-store",
    };
  };

  async function createZeroAmountPayment() {
    const invoice = await invoiceApi.create({
      data: {
        amount: 0,
        status: "open",
      },
      options: {
        headers: secretHeaders(),
      },
    });
    cleanupTasks.unshift(() => {
      return invoiceApi.delete({
        id: invoice.id,
        options: { headers: secretHeaders() },
      });
    });

    const paymentIntent = await paymentIntentApi.create({
      data: {
        amount: 0,
        status: "requires_payment_method",
        type: "one_off",
      },
      options: {
        headers: secretHeaders(),
      },
    });
    cleanupTasks.unshift(() => {
      return paymentIntentApi.delete({
        id: paymentIntent.id,
        options: { headers: secretHeaders() },
      });
    });

    const relation = await paymentIntentsToInvoicesApi.create({
      data: {
        paymentIntentId: paymentIntent.id,
        invoiceId: invoice.id,
      },
      options: {
        headers: secretHeaders(),
      },
    });
    cleanupTasks.unshift(() => {
      return paymentIntentsToInvoicesApi.delete({
        id: relation.id,
        options: { headers: secretHeaders() },
      });
    });

    return { invoiceId: invoice.id, paymentIntentId: paymentIntent.id };
  }

  function postWebhook(props: { provider: string; invoiceId: string }) {
    return fetch(
      `${getApiUrl()}/api/billing/payment-intents/${props.provider}/webhook`,
      {
        method: "POST",
        headers: {
          ...secretHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { id: props.invoiceId } }),
      },
    );
  }

  async function readStatuses(props: {
    invoiceId: string;
    paymentIntentId: string;
  }) {
    const invoice = await invoiceApi.findById({
      id: props.invoiceId,
      options: { headers: secretHeaders() },
    });
    const paymentIntent = await paymentIntentApi.findById({
      id: props.paymentIntentId,
      options: { headers: secretHeaders() },
    });

    return {
      invoice: invoice?.status,
      paymentIntent: paymentIntent?.status,
    };
  }

  afterEach(async () => {
    while (cleanupTasks.length) {
      const task = cleanupTasks.shift();

      try {
        await task?.();
      } catch {
        // best effort cleanup
      }
    }
  });

  /**
   * BDD Scenario: webhook for a provider outside the list.
   *
   * Given: a zero-amount invoice linked to a payment intent, and a provider name the list does not contain.
   * When: the webhook for that provider is posted with the invoice id.
   * Then: the API answers 400 and the invoice and payment intent keep their unpaid statuses.
   */
  it("When: the webhook names a provider outside the list Then: it answers 400 and leaves the invoice and payment intent unpaid", async () => {
    const provider = `scenario-unlisted-${Date.now()}`;
    expect(ALLOWED_BILLING_SERVICE_PROVIDERS.split(",")).not.toContain(
      provider,
    );
    const payment = await createZeroAmountPayment();

    const response = await postWebhook({
      provider,
      invoiceId: payment.invoiceId,
    });

    expect(response.status).toBe(400);
    await expect(readStatuses(payment)).resolves.toEqual({
      invoice: "open",
      paymentIntent: "requires_payment_method",
    });
  });

  /**
   * BDD Scenario: webhook for a listed provider.
   *
   * Given: a zero-amount invoice linked to a payment intent, and the first provider of the list.
   * When: the webhook for that provider is posted with the invoice id, as payment creation does for a free payment.
   * Then: the API answers 200, the invoice is paid and the payment intent succeeded.
   */
  it("When: the webhook names a listed provider Then: it settles the zero-amount invoice and its payment intent", async () => {
    const [provider] = ALLOWED_BILLING_SERVICE_PROVIDERS.split(",");
    const payment = await createZeroAmountPayment();

    const response = await postWebhook({
      provider,
      invoiceId: payment.invoiceId,
    });

    expect(response.status).toBe(200);
    await expect(readStatuses(payment)).resolves.toEqual({
      invoice: "paid",
      paymentIntent: "succeeded",
    });
  });
});
