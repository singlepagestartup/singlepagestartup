/**
 * BDD Scenario: Analytic module admin-v2 rollout smoke.
 *
 * Given: ecommerce, agent, and analytic API endpoints are mocked with deterministic fixtures.
 * When: user opens analytic admin-v2 routes and performs create/delete actions for both models.
 * Then: analytic module pages render correctly and CRUD actions hit mocked `/api/analytic/*` endpoints.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";
import { setupAgentApiMocks } from "../support/mock-agent-api";
import { setupAnalyticApiMocks } from "../support/mock-analytic-api";

test.describe("GIVEN: admin shell has ecommerce, agent, and analytic API mocks", () => {
  test("WHEN: user validates analytic admin-v2 routes and CRUD actions THEN: UI and API contracts are satisfied", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);
    await setupAgentApiMocks(page);
    const analyticState = await setupAnalyticApiMocks(page);

    await test.step("THEN: /admin/analytic renders overview cards for both analytic models", async () => {
      await page.goto("/admin/analytic");
      await expect(page).toHaveURL(/\/admin\/analytic$/);

      const main = page.locator("main").first();
      await expect(
        main.getByRole("heading", { name: "Metric", exact: true }),
      ).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "Widget", exact: true }),
      ).toBeVisible();
    });

    await test.step("THEN: /admin/analytic/metric supports create and delete", async () => {
      await page.goto("/admin/analytic/metric");
      await expect(page).toHaveURL(/\/admin\/analytic\/metric$/);
      await expect(
        page.getByRole("heading", { name: "Metric", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Monthly active users").first(),
      ).toBeVisible();

      await page.getByRole("button", { name: "Add new" }).click();
      await expect(
        page.locator("div[data-model='metric'][data-variant='admin-v2-form']"),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => analyticState.createMetricCalls).toBe(1);
      await page.keyboard.press("Escape");

      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => analyticState.deleteMetricCalls).toBe(1);
    });

    await test.step("THEN: /admin/analytic/widget supports create and delete", async () => {
      await page.goto("/admin/analytic/widget");
      await expect(page).toHaveURL(/\/admin\/analytic\/widget$/);
      await expect(
        page.getByRole("heading", { name: "Widget", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Analytic widget").first()).toBeVisible();

      await page.getByRole("button", { name: "Add new" }).click();
      await expect(
        page.locator("div[data-model='widget'][data-variant='admin-v2-form']"),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => analyticState.createWidgetCalls).toBe(1);
      await page.keyboard.press("Escape");

      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => analyticState.deleteWidgetCalls).toBe(1);
    });
  });
});
