/**
 * BDD Scenario: Admin shell navigation between ecommerce models.
 *
 * Given: ecommerce API responses are mocked for deterministic data.
 * When: user opens /admin, checks dashboard cards, uses settings entrypoint, and navigates via sidebar.
 * Then: dashboard counts, settings navigation, URLs, headings, and mocked model data are rendered correctly.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("GIVEN: ecommerce API responses are mocked and admin shell is available", () => {
  test("WHEN: user validates dashboard, settings entrypoint, and model navigation", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await test.step("THEN: admin root and ecommerce shell are rendered", async () => {
      await page.goto("/admin");
      await expect(page.getByTestId("admin-prototype-body")).toBeVisible();
      await expect(page.getByTestId("admin-prototype-root")).toBeVisible();
    });

    await test.step("THEN: ecommerce dashboard cards show expected entity counters", async () => {
      await page.locator('[data-module-item="ecommerce"]').click();
      await expect(page).toHaveURL(/\/admin\/ecommerce$/);

      const productCard = page
        .getByRole("heading", { name: "Product", exact: true })
        .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');
      const attributeCard = page
        .getByRole("heading", { name: "Attribute", exact: true })
        .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');

      await expect(productCard.locator("span.inline-flex").first()).toHaveText(
        "1",
      );
      await expect(
        attributeCard.locator("span.inline-flex").first(),
      ).toHaveText("1");
    });

    await test.step("THEN: settings button is visible and navigates to settings page", async () => {
      await expect(page.locator("#settingsButton")).toBeVisible();
      await page.locator("#settingsButton").click();
      await expect(page).toHaveURL(/\/admin\/settings$/);
      await expect(page.getByTestId("settings-page")).toBeVisible();
    });

    await test.step("THEN: sidebar navigation opens product and attribute model routes", async () => {
      await page.goto("/admin");
      await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

      await page.locator('[data-module-item="ecommerce"]').click();
      await expect(page).toHaveURL(/\/admin\/ecommerce$/);

      await page.locator('[data-model-item="ecommerce:product"]').click();
      await expect(page).toHaveURL(/\/admin\/ecommerce\/product$/);
      await expect(
        page.getByRole("heading", { name: "Product", exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Mock Product Alpha").first()).toBeVisible();

      await page.locator('[data-model-item="ecommerce:attribute"]').click();
      await expect(page).toHaveURL(/\/admin\/ecommerce\/attribute$/);
      await expect(
        page.getByRole("heading", { name: "Attribute", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("Mock Attribute Color").first(),
      ).toBeVisible();
    });
  });
});
