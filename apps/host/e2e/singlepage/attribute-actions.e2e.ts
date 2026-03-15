/**
 * BDD Scenario: Attribute CRUD actions from admin UI with mocked API.
 *
 * Given: ecommerce API handlers are mocked and track attribute create/delete calls.
 * When: user opens /admin/ecommerce/attribute, creates an attribute, and deletes a row.
 * Then: create and delete actions call attribute API endpoints exactly once.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("GIVEN: attribute API endpoints are mocked with create/delete tracking", () => {
  test("WHEN: user creates and deletes an attribute from admin list THEN: API counters increment exactly once per action", async ({
    page,
  }) => {
    const apiState = await setupEcommerceApiMocks(page);

    await test.step("THEN: attribute list is loaded with mocked row", async () => {
      await page.goto("/admin/ecommerce/attribute");
      await expect(
        page.getByText("Mock Attribute Color").first(),
      ).toBeVisible();
    });

    await test.step("THEN: creating attribute triggers exactly one create API call", async () => {
      await page.getByRole("button", { name: "Add new" }).click();
      await expect(
        page.getByRole("heading", { name: /Create Attribute/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /^Create$/ }).click();
      await expect.poll(() => apiState.createAttributeCalls).toBe(1);
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: deleting attribute triggers exactly one delete API call", async () => {
      await page
        .getByRole("button", { name: /^Delete$/ })
        .first()
        .click();
      await page
        .locator('[role="alertdialog"]')
        .getByRole("button", { name: /^Delete$/ })
        .click();
      await expect.poll(() => apiState.deleteAttributeCalls).toBe(1);
    });
  });
});
