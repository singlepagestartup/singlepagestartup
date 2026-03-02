/**
 * BDD Scenario: Navigate from admin sidebar to product edit form.
 *
 * Given: ecommerce API responses are mocked and admin starts at /admin.
 * When: user opens ecommerce module, enters product page, and clicks Edit.
 * Then: route transitions succeed, table data is visible, and update form opens.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("admin navigation and edit flow", () => {
  test("navigates from sidebar to product table and opens edit form", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    await page.locator('[data-module-item="ecommerce"]').click();
    await expect(page).toHaveURL(/\/admin\/ecommerce$/);

    await page.locator('[data-model-item="ecommerce:product"]').click();
    await expect(page).toHaveURL(/\/admin\/ecommerce\/product$/);
    await expect(page.getByText("Loading...")).toHaveCount(0, {
      timeout: 60_000,
    });
    await expect(page.getByText("Mock Product Alpha").first()).toBeVisible({
      timeout: 60_000,
    });

    await page
      .getByRole("button", { name: /^Edit$/ })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Update Product", exact: true }),
    ).toBeVisible();
  });
});
