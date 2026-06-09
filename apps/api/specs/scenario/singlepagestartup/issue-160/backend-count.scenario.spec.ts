/**
 * BDD Suite: issue-160 backend count endpoint with real API and database.
 *
 * Given: API server and database are running with shared REST-backed ecommerce products.
 * When: the universal /count endpoint is requested with and without filters.and.
 * Then: the API returns numeric totals that match direct database counts.
 */

import QueryString from "qs";
import {
  getProductCountByVariantFromDb,
  getProductCountFromDb,
} from "./test-utils/db";
import { expectOk, requestApi } from "../issue-152/test-utils/http";

type TEntityPayload = {
  data?: {
    id?: string;
  };
};

type TCountPayload = {
  data?: number;
};

async function createProduct(data: Record<string, unknown>) {
  const result = await expectOk<TEntityPayload>({
    method: "POST",
    path: "/api/ecommerce/products",
    includeSecret: true,
    data,
  });

  const id = result.payload?.data?.id;

  if (!id) {
    throw new Error(
      `Product create response does not contain id: ${JSON.stringify(result.payload)}`,
    );
  }

  return id;
}

async function deleteProduct(id: string) {
  await requestApi({
    method: "DELETE",
    path: `/api/ecommerce/products/${id}`,
    includeSecret: true,
  });
}

describe("Given: issue-160 backend count scenario", () => {
  const productIds: string[] = [];
  const variant = `issue-160-${Date.now().toString(36)}`;

  beforeAll(async () => {
    productIds.push(
      await createProduct({
        variant,
        slug: `${variant}-a`,
        adminTitle: `${variant} A`,
      }),
    );
    productIds.push(
      await createProduct({
        variant,
        slug: `${variant}-b`,
        adminTitle: `${variant} B`,
      }),
    );
    productIds.push(
      await createProduct({
        variant: `${variant}-control`,
        slug: `${variant}-control`,
        adminTitle: `${variant} Control`,
      }),
    );
  });

  afterAll(async () => {
    for (const productId of productIds) {
      await deleteProduct(productId);
    }
  });

  /**
   * BDD Scenario: unfiltered product count endpoint.
   *
   * Given: deterministic products exist in the scenario database.
   * When: GET /api/ecommerce/products/count is requested.
   * Then: the numeric API payload equals the direct database aggregate.
   */
  it("When: unfiltered count is requested Then: API result matches direct DB count", async () => {
    const expectedCount = await getProductCountFromDb();

    const result = await expectOk<TCountPayload>({
      method: "GET",
      path: "/api/ecommerce/products/count",
      includeSecret: true,
    });

    expect(typeof result.payload.data).toBe("number");
    expect(result.payload.data).toBe(expectedCount);
  });

  /**
   * BDD Scenario: filtered product count endpoint.
   *
   * Given: products with a unique scenario variant exist in the database.
   * When: GET /api/ecommerce/products/count is requested with filters.and.
   * Then: the numeric API payload equals the direct filtered database aggregate.
   */
  it("When: filtered count is requested Then: filters.and is honored", async () => {
    const expectedCount = await getProductCountByVariantFromDb(variant);
    const query = QueryString.stringify(
      {
        filters: {
          and: [
            {
              column: "variant",
              method: "eq",
              value: variant,
            },
          ],
        },
      },
      {
        encodeValuesOnly: true,
      },
    );

    const result = await expectOk<TCountPayload>({
      method: "GET",
      path: `/api/ecommerce/products/count?${query}`,
      includeSecret: true,
    });

    expect(result.payload.data).toBe(expectedCount);
    expect(result.payload.data).toBeGreaterThanOrEqual(2);
  });
});
