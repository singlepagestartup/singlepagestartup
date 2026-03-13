/**
 * BDD Suite: Admin panel URL-based visibility guards.
 *
 * Given: ecommerce API responses are mocked for deterministic data.
 * When: user navigates to different admin routes.
 * Then: correct page components are rendered based on URL path.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("admin visibility guards", () => {
  test("shows ecommerce panel at /admin root", async ({ page }) => {
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

  test("shows ecommerce panel at /admin/ecommerce", async ({ page }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin/ecommerce");
    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();

    // Ecommerce panel should be visible
    await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

    // Settings page should NOT be visible
    await expect(page.getByTestId("settings-page")).not.toBeVisible();
  });

  test("shows ecommerce panel at /admin/ecommerce/product", async ({
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

  test("shows settings page at /admin/settings", async ({ page }) => {
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

  test("shows account settings page at /admin/settings/account", async ({
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
