import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("product actions smoke", () => {
  test("creates and deletes product using mocked api", async ({ page }) => {
    const apiState = await setupEcommerceApiMocks(page);

    await page.goto("/en/admin/modules/ecommerce/models/product");

    await expect(page.getByText("Mock Product Alpha")).toBeVisible();

    await page.getByRole("button", { name: "Add new" }).click();
    await expect(
      page.getByRole("heading", { name: /Create Product/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Create$/ }).click();
    await expect.poll(() => apiState.createProductCalls).toBe(1);

    await page.keyboard.press("Escape");

    await page
      .getByRole("button", { name: /^Delete$/ })
      .first()
      .click();
    await page
      .locator('[role="alertdialog"]')
      .getByRole("button", { name: /^Delete$/ })
      .click();
    await expect.poll(() => apiState.deleteProductCalls).toBe(1);
  });
});
