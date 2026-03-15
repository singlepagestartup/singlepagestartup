/**
 * BDD Suite: Admin panel URL-based visibility guards.
 *
 * Given: ecommerce API responses are mocked for deterministic data.
 * When: user navigates to different admin routes.
 * Then: correct page components are rendered based on URL path.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("GIVEN: admin URL visibility guards are active with mocked ecommerce API", () => {
  test("WHEN: user opens /admin THEN: ecommerce panel is visible and settings/account pages are hidden", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Ecommerce panel should be visible
    await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

    // Settings page should NOT be visible
    await expect(page.getByTestId("settings-page")).not.toBeVisible();

    // Account page should NOT be visible
    await expect(page.getByTestId("account-settings-page")).not.toBeVisible();
  });

  test("WHEN: user opens /admin/ecommerce THEN: ecommerce panel is visible and settings page is hidden", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin/ecommerce");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Ecommerce panel should be visible
    await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

    // Settings page should NOT be visible
    await expect(page.getByTestId("settings-page")).not.toBeVisible();
  });

  test("WHEN: user opens /admin/ecommerce/product THEN: ecommerce panel is visible and settings page is hidden", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin/ecommerce/product");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Ecommerce panel should be visible
    await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

    // Settings page should NOT be visible
    await expect(page.getByTestId("settings-page")).not.toBeVisible();
  });

  test("WHEN: user opens /admin/settings THEN: settings page is visible and ecommerce/account pages are hidden", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin/settings");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Settings page should be visible
    await expect(page.getByTestId("settings-page")).toBeVisible();

    // Ecommerce panel should NOT be visible
    await expect(page.getByTestId("admin-prototype-root")).not.toBeVisible();

    // Account page should NOT be visible
    await expect(page.getByTestId("account-settings-page")).not.toBeVisible();
  });

  test("WHEN: user opens /admin/settings/account THEN: account page is visible and ecommerce/settings pages are hidden", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin/settings/account");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Account page should be visible
    await expect(page.getByTestId("account-settings-page")).toBeVisible();

    // Ecommerce panel should NOT be visible
    await expect(page.getByTestId("admin-prototype-root")).not.toBeVisible();

    // Settings page should NOT be visible (account page takes precedence)
    await expect(page.getByTestId("settings-page")).not.toBeVisible();
  });
});
