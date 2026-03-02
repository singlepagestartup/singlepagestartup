import { expect, test } from "@playwright/test";
import { setupEcommerceApiMocks } from "../support/mock-ecommerce-api";

test.describe("admin shell smoke", () => {
  test("opens admin panel and navigates between ecommerce models", async ({
    page,
  }) => {
    await setupEcommerceApiMocks(page);

    await page.goto("/admin");

    await expect(page.getByTestId("admin-prototype-body")).toBeVisible();
    await expect(page.getByTestId("admin-prototype-root")).toBeVisible();

    await page.locator('[data-module-item="ecommerce"]').click();
    await expect(page).toHaveURL(/\/admin\/modules\/ecommerce$/);

    await page.locator('[data-model-item="ecommerce:product"]').click();
    await expect(page).toHaveURL(
      /\/admin\/modules\/ecommerce\/models\/product$/,
    );
    await expect(
      page.getByRole("heading", { name: "Product", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Mock Product Alpha")).toBeVisible();

    await page.locator('[data-model-item="ecommerce:attribute"]').click();
    await expect(page).toHaveURL(
      /\/admin\/modules\/ecommerce\/models\/attribute$/,
    );
    await expect(
      page.getByRole("heading", { name: "Attribute", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Mock Attribute Color")).toBeVisible();
  });
});
