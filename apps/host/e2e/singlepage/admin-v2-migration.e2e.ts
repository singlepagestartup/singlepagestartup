/**
 * BDD Scenario: Full ecommerce admin-v2 model and relation migration smoke.
 *
 * Given: ecommerce and external API endpoints are mocked with deterministic fixtures.
 * When: user navigates all ecommerce model routes, opens form sheets, and uses relation open-related actions.
 * Then: all model routes render admin-v2 tables, relation opposite-side opening works, and external fallback uses admin-form.
 */

import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("GIVEN: ecommerce admin-v2 module is mounted with mocked APIs", () => {
  test("WHEN: user checks model routes and relation open-related flows THEN migration contracts are satisfied", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    const modelRoutes = [
      { id: "widget", title: "Widget" },
      { id: "product", title: "Product" },
      { id: "store", title: "Store" },
      { id: "category", title: "Category" },
      { id: "attribute", title: "Attribute" },
      { id: "attribute-key", title: "Attribute Key" },
      { id: "order", title: "Order" },
    ] as const;

    await test.step("THEN: every ecommerce model route renders table and create form sheet", async () => {
      for (const model of modelRoutes) {
        await page.goto(`/admin/ecommerce/${model.id}`);
        await expect(page).toHaveURL(
          new RegExp(`/admin/ecommerce/${model.id}$`),
        );
        await expect(
          page.getByRole("heading", { name: model.title, exact: true }),
        ).toBeVisible();

        await page.getByRole("button", { name: "Add new" }).click();
        await expect(
          page.locator(
            `div[data-model='${model.id}'][data-variant='admin-v2-form']`,
          ),
        ).toBeVisible();
        await page.keyboard.press("Escape");
      }
    });

    await test.step("THEN: categories-to-products relation opens opposite model in product context", async () => {
      await page.goto("/admin/ecommerce/product");
      await expect(page.getByText("Mock Product Alpha").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      await page.getByRole("tab", { name: /^Relations/ }).click();
      await page.getByRole("tab", { name: "Categories", exact: true }).click();

      const relationTable = page
        .locator("[data-relation='categories-to-products']")
        .first();
      await expect(relationTable).toBeVisible();

      const row = relationTable.locator("article").first();
      await row.locator("button").nth(1).click();
      await expect(
        page.locator(
          "div[data-model='category'][data-variant='admin-v2-form']",
        ),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: categories-to-products relation opens opposite model in category context", async () => {
      await page.goto("/admin/ecommerce/category");
      await expect(page.getByText("Mock Category Main").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      await page.getByRole("tab", { name: /^Relations/ }).click();
      await page.getByRole("tab", { name: "Products", exact: true }).click();

      const relationTable = page
        .locator("[data-relation='categories-to-products']")
        .first();
      await expect(relationTable).toBeVisible();

      const row = relationTable.locator("article").first();
      await row.locator("button").nth(1).click();
      await expect(
        page.locator("div[data-model='product'][data-variant='admin-v2-form']"),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: external relation open-related uses admin-form fallback", async () => {
      await page.goto("/admin/ecommerce/order");
      await expect(page.getByText("cart").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      await page.getByRole("tab", { name: /^Relations/ }).click();
      await page.getByRole("tab", { name: "Currencies", exact: true }).click();

      const relationTable = page
        .locator("[data-relation='orders-to-billing-module-currencies']")
        .first();
      await expect(relationTable).toBeVisible();

      const row = relationTable.locator("article").first();
      await row.locator("button").nth(1).click();
      await expect(
        page.locator("div[data-model='currency'][data-variant='admin-form']"),
      ).toBeVisible();
    });
  });
});
