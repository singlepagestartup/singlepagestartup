/**
 * BDD Scenario: Billing module admin-v2 rollout smoke.
 *
 * Given: ecommerce, agent, analytic, and billing API endpoints are mocked with deterministic fixtures.
 * When: user opens billing admin-v2 routes and performs payment-intent create/delete actions.
 * Then: billing module pages render correctly and relation tables are requested from mocked `/api/billing/*` endpoints.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";
import { setupAgentApiMocks } from "../support/mock-agent-api";
import { setupAnalyticApiMocks } from "../support/mock-analytic-api";
import { setupBillingApiMocks } from "../support/mock-billing-api";

test.describe("GIVEN: admin shell has ecommerce, agent, analytic, and billing API mocks", () => {
  test("WHEN: user validates billing admin-v2 routes and payment-intent CRUD THEN: UI and API contracts are satisfied", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);
    await setupAgentApiMocks(page);
    await setupAnalyticApiMocks(page);
    const billingState = await setupBillingApiMocks(page);

    await test.step("THEN: /admin/billing opens billing overview", async () => {
      await page.goto("/admin/billing");
      await expect(page).toHaveURL(/\/admin\/billing$/);
      await expect(
        page.getByRole("link", { name: /billing/i }).first(),
      ).toBeVisible();
    });

    await test.step("THEN: /admin/billing/payment-intent supports relation fetch and create/delete", async () => {
      await page.goto("/admin/billing/payment-intent");
      await expect(page).toHaveURL(/\/admin\/billing\/payment-intent$/);
      await expect(
        page.getByRole("heading", { name: "Payment Intent", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("requires_payment_method").first(),
      ).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      const paymentIntentForm = page.locator(
        "div[data-model='payment-intent'][data-variant='admin-v2-form']",
      );
      await expect(paymentIntentForm).toBeVisible();
      await expect(
        paymentIntentForm.getByRole("tab", { name: /^Details$/ }),
      ).toBeVisible();
      await expect(
        paymentIntentForm.getByRole("tab", { name: /^Relations\\s*2$/ }),
      ).toBeVisible();
      await expect(
        paymentIntentForm.getByRole("tab", { name: /^Invoices$/ }),
      ).toHaveCount(0);

      await paymentIntentForm
        .getByRole("tab", { name: /^Relations\\s*2$/ })
        .click();
      await expect(
        paymentIntentForm.getByRole("tab", { name: /^Invoices$/ }),
      ).toBeVisible();
      await expect(
        paymentIntentForm.getByRole("tab", { name: /^Currencies$/ }),
      ).toBeVisible();
      await paymentIntentForm.getByRole("tab", { name: /^Invoices$/ }).click();
      await expect(
        paymentIntentForm.getByRole("button", { name: /^Invoice$/ }).first(),
      ).toBeVisible();
      await paymentIntentForm
        .getByRole("tab", { name: /^Currencies$/ })
        .click();
      await expect(
        paymentIntentForm.getByRole("button", { name: /^Currency$/ }).first(),
      ).toBeVisible();

      await expect
        .poll(() => billingState.paymentIntentsToCurrenciesGetCalls)
        .toBeGreaterThan(0);
      await expect
        .poll(() => billingState.paymentIntentsToInvoicesGetCalls)
        .toBeGreaterThan(0);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Add new" }).first().click();
      await expect(
        page.locator(
          "div[data-model='payment-intent'][data-variant='admin-v2-form']",
        ),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => billingState.createPaymentIntentCalls).toBe(1);
      await page.keyboard.press("Escape");

      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => billingState.deletePaymentIntentCalls).toBe(1);
    });

    await test.step("THEN: /admin/billing/invoice renders invoice table", async () => {
      await page.goto("/admin/billing/invoice");
      await expect(page).toHaveURL(/\/admin\/billing\/invoice$/);
      await expect(
        page.getByRole("heading", { name: "Invoice", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("draft").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      const invoiceForm = page.locator(
        "div[data-model='invoice'][data-variant='admin-v2-form']",
      );
      await expect(invoiceForm).toBeVisible();
      await expect(
        invoiceForm.getByRole("tab", { name: /^Details$/ }),
      ).toBeVisible();
      await expect(
        invoiceForm.getByRole("tab", { name: /^Relations\\s*1$/ }),
      ).toBeVisible();
      await invoiceForm.getByRole("tab", { name: /^Relations\\s*1$/ }).click();
      await expect(
        invoiceForm.getByRole("tab", { name: /^Payment intents$/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: /admin/billing/currency renders currency table", async () => {
      await page.goto("/admin/billing/currency");
      await expect(page).toHaveURL(/\/admin\/billing\/currency$/);
      await expect(
        page.getByRole("heading", { name: "Currency", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("US Dollar").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      const currencyForm = page.locator(
        "div[data-model='currency'][data-variant='admin-v2-form']",
      );
      await expect(currencyForm).toBeVisible();
      await expect(
        currencyForm.getByRole("tab", { name: /^Details$/ }),
      ).toBeVisible();
      await expect(
        currencyForm.getByRole("tab", { name: /^Relations\\s*1$/ }),
      ).toBeVisible();
      await currencyForm.getByRole("tab", { name: /^Relations\\s*1$/ }).click();
      await expect(
        currencyForm.getByRole("tab", { name: /^Payment intents$/ }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: /admin/billing/widget renders widget table", async () => {
      await page.goto("/admin/billing/widget");
      await expect(page).toHaveURL(/\/admin\/billing\/widget$/);
      await expect(
        page.getByRole("heading", { name: "Widget", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Billing Widget").first()).toBeVisible();
    });
  });
});
