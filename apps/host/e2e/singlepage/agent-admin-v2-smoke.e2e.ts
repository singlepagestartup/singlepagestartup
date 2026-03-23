/**
 * BDD Scenario: Agent module admin-v2 rollout smoke.
 *
 * Given: ecommerce and agent API endpoints are mocked with deterministic fixtures.
 * When: user opens agent admin-v2 routes and performs create/delete actions for both models.
 * Then: agent module pages render correctly and CRUD actions hit mocked `/api/agent/*` endpoints.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";
import { setupAgentApiMocks } from "../support/mock-agent-api";

test.describe("GIVEN: admin shell has ecommerce and agent API mocks", () => {
  test("WHEN: user validates agent admin-v2 routes and CRUD actions THEN: UI and API contracts are satisfied", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);
    const agentState = await setupAgentApiMocks(page);

    await test.step("THEN: /admin/agent renders overview cards for both agent models", async () => {
      await page.goto("/admin/agent");
      await expect(page).toHaveURL(/\/admin\/agent$/);

      const main = page.locator("main").first();
      await expect(
        main.getByRole("heading", { name: "Agent", exact: true }),
      ).toBeVisible();
      await expect(
        main.getByRole("heading", { name: "Widget", exact: true }),
      ).toBeVisible();
    });

    await test.step("THEN: /admin/agent/agent supports create and delete", async () => {
      await page.goto("/admin/agent/agent");
      await expect(page).toHaveURL(/\/admin\/agent\/agent$/);
      await expect(
        page.getByRole("heading", { name: "Agent", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Agent health check").first()).toBeVisible();

      await page.getByRole("button", { name: "Add new" }).click();
      await expect(
        page.locator("div[data-model='agent'][data-variant='admin-v2-form']"),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => agentState.createAgentCalls).toBe(1);
      await page.keyboard.press("Escape");

      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => agentState.deleteAgentCalls).toBe(1);
    });

    await test.step("THEN: /admin/agent/widget supports create and delete", async () => {
      await page.goto("/admin/agent/widget");
      await expect(page).toHaveURL(/\/admin\/agent\/widget$/);
      await expect(
        page.getByRole("heading", { name: "Widget", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Mock Agent Widget").first()).toBeVisible();

      await page.getByRole("button", { name: "Add new" }).click();
      await expect(
        page.locator("div[data-model='widget'][data-variant='admin-v2-form']"),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => agentState.createWidgetCalls).toBe(1);
      await page.keyboard.press("Escape");

      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => agentState.deleteWidgetCalls).toBe(1);
    });
  });
});
