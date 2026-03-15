/**
 * BDD Scenario: Product and attribute relations flow in admin-v2.
 *
 * Given: ecommerce API responses are mocked with deterministic product/attribute/relation data.
 * When: user opens product relations, opens related attribute form, and creates a relation from product context.
 * Then: relations UI is visible, related form opens, relation create payload contains prefilled productId, and attribute relations are enabled.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("GIVEN: product, attribute, and relation APIs are mocked with deterministic fixtures", () => {
  test("WHEN: user manages relations from product and attribute admin-v2 forms", async ({
    page,
  }) => {
    const apiState = await setupEcommerceApiMocks(page);
    const currentProductId = apiState.products[0]?.id;

    await test.step("THEN: product relations tab is available and relation rows are visible", async () => {
      await page.goto("/admin/ecommerce/product");
      await expect(page.getByText("Mock Product Alpha").first()).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: /Update Product/i }),
      ).toBeVisible();

      const productRelationsTab = page.getByRole("tab", {
        name: /^Relations/,
      });
      await expect(productRelationsTab).toBeEnabled();
      await productRelationsTab.click();

      const productRelationsTable = page
        .locator('[data-relation="products-to-attributes"]')
        .first();
      await expect(productRelationsTable).toBeVisible();
      await expect(
        productRelationsTable.getByText("33333333-3333-3333-3333-333333333333"),
      ).toBeVisible();
    });

    await test.step("THEN: opening related entity from relation row shows attribute edit form", async () => {
      const productRelationsTable = page
        .locator('[data-relation="products-to-attributes"]')
        .first();
      const firstRelationRow = productRelationsTable.locator("article").first();
      await firstRelationRow.locator("button").nth(1).click();
      await expect(
        page.getByRole("heading", { name: /Update Attribute/i }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("heading", { name: /Update Product/i }),
      ).toBeVisible();
    });

    await test.step("THEN: creating relation from product context sends prefilled productId", async () => {
      const productRelationsTable = page
        .locator('[data-relation="products-to-attributes"]')
        .first();
      await productRelationsTable
        .getByRole("button", { name: "Add new" })
        .click();
      await expect(
        page.getByRole("heading", { name: /Create Products To Attributes/i }),
      ).toBeVisible();

      const relationCreateForm = page
        .locator('div[data-relation="products-to-attributes"][data-id=""]')
        .last();
      const attributeSearch =
        relationCreateForm.getByPlaceholder("Select attribute");
      await attributeSearch.fill("Mock Attribute Color");

      const attributeOption = relationCreateForm
        .locator("[cmdk-item]")
        .filter({ hasText: "Mock Attribute Color" })
        .first();
      await expect(attributeOption).toBeVisible();
      await attributeOption.click();

      await relationCreateForm
        .getByRole("button", { name: /^Create$/ })
        .click();
      await expect.poll(() => apiState.createProductsToAttributesCalls).toBe(1);
      await expect
        .poll(
          () => apiState.createProductsToAttributesPayloads.at(-1)?.productId,
        )
        .toBe(currentProductId);

      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    });

    await test.step("THEN: attribute relations tab is enabled and renders relation content", async () => {
      await page.goto("/admin/ecommerce/attribute");
      await expect(page).toHaveURL(/\/admin\/ecommerce\/attribute$/);
      await expect(
        page.getByText("Mock Attribute Color").first(),
      ).toBeVisible();

      await page
        .getByRole("button", { name: /^Edit$/ })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: /Update Attribute/i }),
      ).toBeVisible();

      const attributeRelationsTab = page.getByRole("tab", {
        name: /^Relations/,
      });
      await expect(attributeRelationsTab).toBeEnabled();
      await attributeRelationsTab.click();

      await page.getByRole("tab", { name: "Products", exact: true }).click();
      const attributeRelationsTable = page
        .locator('[data-relation="products-to-attributes"]')
        .first();
      await expect(attributeRelationsTable).toBeVisible();
      await expect(
        attributeRelationsTable.getByRole("button", { name: "Add new" }),
      ).toBeVisible();
    });
  });
});
