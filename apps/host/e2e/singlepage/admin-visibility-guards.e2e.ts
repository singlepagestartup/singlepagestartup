/**
 * BDD Suite: Admin panel URL-based visibility guards.
 *
 * Given: admin RBAC subject lifecycle is provisioned and ecommerce API responses are mocked for deterministic data.
 * When: authenticated admin and anonymous users navigate to admin routes.
 * Then: admin-v2 content is visible only for authenticated admin access and route-specific views remain correct.
 */
import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";
import {
  authenticateAdminRbacSession,
  cleanupAdminRbacSubjectForE2E,
  provisionAdminRbacSubjectForE2E,
} from "../support/rbac-admin-lifecycle";

test.describe("GIVEN: admin URL visibility guards are active with mocked ecommerce API", () => {
  test.beforeAll(() => {
    provisionAdminRbacSubjectForE2E();
  });

  test.afterAll(() => {
    cleanupAdminRbacSubjectForE2E();
  });

  test.describe("GIVEN: authenticated admin session", () => {
    test.beforeEach(async ({ page }) => {
      await setupEcommerceApiMocks(page);
      await authenticateAdminRbacSession(page);
    });

    test("WHEN: admin opens /admin THEN: ecommerce panel is visible and settings/account pages are hidden", async ({
      page,
    }) => {
      await page.goto("/admin");
      await expect(page.getByTestId("admin-v2-body")).toBeVisible();
      await expect(page.getByTestId("admin-v2-root")).toBeVisible();
      await expect(page.getByTestId("settings-page")).not.toBeVisible();
      await expect(page.getByTestId("account-settings-page")).not.toBeVisible();
    });

    test("WHEN: admin opens /admin/ecommerce THEN: ecommerce panel is visible and settings page is hidden", async ({
      page,
    }) => {
      await page.goto("/admin/ecommerce");
      await expect(page.getByTestId("admin-v2-body")).toBeVisible();
      await expect(page.getByTestId("admin-v2-root")).toBeVisible();
      await expect(page.getByTestId("settings-page")).not.toBeVisible();
    });

    test("WHEN: admin opens /admin/ecommerce/product THEN: ecommerce panel is visible and settings page is hidden", async ({
      page,
    }) => {
      await page.goto("/admin/ecommerce/product");
      await expect(page.getByTestId("admin-v2-body")).toBeVisible();
      await expect(page.getByTestId("admin-v2-root")).toBeVisible();
      await expect(page.getByTestId("settings-page")).not.toBeVisible();
    });

    test("WHEN: admin opens /admin/settings THEN: settings page is visible and ecommerce/account pages are hidden", async ({
      page,
    }) => {
      await page.goto("/admin/settings");
      await expect(page.getByTestId("admin-v2-body")).toBeVisible();
      await expect(page.getByTestId("settings-page")).toBeVisible();
      await expect(page.getByTestId("admin-v2-root")).not.toBeVisible();
      await expect(page.getByTestId("account-settings-page")).not.toBeVisible();
    });

    test("WHEN: admin opens /admin/settings/account THEN: account page is visible and ecommerce/settings pages are hidden", async ({
      page,
    }) => {
      await page.goto("/admin/settings/account");
      await expect(page.getByTestId("admin-v2-body")).toBeVisible();
      await expect(page.getByTestId("account-settings-page")).toBeVisible();
      await expect(page.getByTestId("admin-v2-root")).not.toBeVisible();
      await expect(page.getByTestId("settings-page")).not.toBeVisible();
    });
  });

  test("WHEN: anonymous user opens /admin THEN: admin-v2 shell is not rendered", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin");
    await expect(page.getByTestId("admin-v2-body")).toHaveCount(0);
    await expect(page.getByTestId("admin-v2-root")).toHaveCount(0);
  });
});
