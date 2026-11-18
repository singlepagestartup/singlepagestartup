/**
 * BDD Suite: the framework sensitive-route list.
 *
 * Given: the framework list of routes that are never public without a role.
 * When: request paths and methods are matched against it.
 * Then: identity, subject, subjects-to-identities and role reads match and unrelated reads do not.
 */

import { Service } from ".";

function createService() {
  return new Service({} as any, { find: jest.fn() } as any);
}

describe("Given: the framework sensitive-route list", () => {
  /**
   * BDD Scenario
   * Given: the identity read permissions ship as a collection, an id template and a count route.
   * When: each of those routes is matched.
   * Then: all three are sensitive.
   */
  it("When: an identity read route is matched Then: reports every form as sensitive", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/rbac/identities", "GET"),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute(
        "/api/rbac/identities/2f0d0a4b-25af-43d6-a6f2-5a425784895c",
        "GET",
      ),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute("/api/rbac/identities/count", "GET"),
    ).resolves.toBe(true);
  });

  /**
   * BDD Scenario
   * Given: the subject, subjects-to-identities and role read routes.
   * When: each is matched.
   * Then: they are sensitive, while the subject-scoped routes below them are not.
   */
  it("When: the adjacent RBAC reads are matched Then: keeps subject-scoped routes public", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/rbac/subjects", "GET"),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute("/api/rbac/subjects-to-identities", "GET"),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute("/api/rbac/roles", "GET"),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute(
        "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/ecommerce-module/orders",
        "GET",
      ),
    ).resolves.toBe(false);
  });

  /**
   * BDD Scenario
   * Given: the subject count route and the identities listed below a subject.
   * When: each is matched.
   * Then: both are sensitive, because one counts subjects and the other answers with identity rows.
   */
  it("When: the subject count and nested identity reads are matched Then: reports both as sensitive", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/rbac/subjects/count", "GET"),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute(
        "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/identities",
        "GET",
      ),
    ).resolves.toBe(true);
    await expect(
      service.isSensitiveRoute(
        "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/identities/8c1f0f3e-1f4a-4f0e-9d2b-73c2a5e1b0aa",
        "GET",
      ),
    ).resolves.toBe(true);
  });

  /**
   * BDD Scenario
   * Given: the subject-scoped routes the seed leaves anonymous on purpose.
   * When: they are matched after the subject rule was widened.
   * Then: they stay public, so the widening did not overreach.
   */
  it("When: other subject-scoped routes are matched Then: leaves them public", async () => {
    const service = createService();

    for (const path of [
      "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/ecommerce-module/cart",
      "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/crm-module/forms",
      "/api/rbac/subjects/2f0d0a4b-25af-43d6-a6f2-5a425784895c/social-module/chats",
    ]) {
      await expect(service.isSensitiveRoute(path, "GET")).resolves.toBe(false);
    }
  });

  /**
   * BDD Scenario
   * Given: reads that the seed leaves role-less on purpose.
   * When: they are matched against the list.
   * Then: none of them is sensitive, so the public surface is unchanged.
   */
  it("When: an unrelated public read is matched Then: leaves it public", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/blog/articles", "GET"),
    ).resolves.toBe(false);
    await expect(
      service.isSensitiveRoute("/api/ecommerce/products", "GET"),
    ).resolves.toBe(false);
    await expect(
      service.isSensitiveRoute("/api/rbac/roles-to-permissions", "GET"),
    ).resolves.toBe(false);
  });

  /**
   * BDD Scenario
   * Given: the rules are anchored at both ends.
   * When: a path merely contains a sensitive segment as part of another one.
   * Then: it does not match.
   */
  it("When: a path only contains a sensitive segment Then: does not match", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/blog/articles/identities", "GET"),
    ).resolves.toBe(false);
    await expect(
      service.isSensitiveRoute("/api/rbac/identities-archive", "GET"),
    ).resolves.toBe(false);
  });

  /**
   * BDD Scenario
   * Given: each rule declares the method it closes.
   * When: the same path is matched under another verb.
   * Then: the verb is decided on its own and stays out of the list.
   */
  it("When: another method hits the same path Then: evaluates it independently", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute("/api/rbac/identities", "POST"),
    ).resolves.toBe(false);
    await expect(
      service.isSensitiveRoute("/api/rbac/identities", "get"),
    ).resolves.toBe(true);
  });

  /**
   * BDD Scenario
   * Given: the middleware may hand over a full request URL or a query string.
   * When: such a route is matched.
   * Then: it is canonicalised to its pathname first.
   */
  it("When: the route carries an origin or a query Then: matches on the pathname", async () => {
    const service = createService();

    await expect(
      service.isSensitiveRoute(
        "http://localhost:4000/api/rbac/identities?limit=10",
        "GET",
      ),
    ).resolves.toBe(true);
  });
});

describe("private commerce and Subject order routes", () => {
  const service = createService();
  it.each([
    ["GET", "/api/billing/payment-intents"],
    ["HEAD", "/api/billing/payment-intents/count"],
    ["GET", "/api/billing/invoices/invoice-id"],
    ["GET", "/api/billing/payment-intents-to-invoices"],
    ["POST", "/api/billing/payment-intents/intent-id/check"],
    ["GET", "/api/ecommerce/orders/order-id/extended"],
    ["PATCH", "/api/ecommerce/orders-to-billing-module-payment-intents/bulk"],
    ["GET", "/api/rbac/subjects-to-ecommerce-module-orders"],
  ])("requires an explicit role for %s %s", async (method, path) => {
    await expect(service.isSensitiveRoute(path, method, path)).resolves.toBe(
      true,
    );
  });
  it.each([
    ["GET", "/api/rbac/subjects/subject-id/ecommerce-module/orders"],
    [
      "POST",
      "/api/rbac/subjects/ecommerce-module/orders/payment-intents/stripe/webhook",
    ],
    ["POST", "/api/ecommerce/stores-to-products/offer-id/quote"],
  ])("keeps the regular permission flow for %s %s", async (method, path) => {
    await expect(service.isSensitiveRoute(path, method, path)).resolves.toBe(
      false,
    );
  });
});

describe("public Social reads", () => {
  const demoId = "72f56db2-4eb1-4798-a302-c138f89da53a";
  const demo = "/api/social/chats/" + demoId;
  const service = createService();

  it.each(["GET", "HEAD"])(
    "requires an exact record grant for %s chat reads",
    async (method) => {
      for (const route of [
        "/api/social/chats",
        "/api/social/chats/count",
        "/api/social/chats/",
      ]) {
        await expect(
          service.isSensitiveRoute(route, method, route),
        ).resolves.toBe(true);
      }
      await expect(
        service.isSensitiveRoute(
          demo,
          method,
          "/api/social/chats/[social.chats.id]",
        ),
      ).resolves.toBe(true);
      await expect(service.isSensitiveRoute(demo, method, demo)).resolves.toBe(
        false,
      );
    },
  );
  it.each(["", "/count", "/" + demoId])(
    "protects raw profile media links%s",
    async (suffix) => {
      const path = "/api/social/profiles-to-file-storage-module-files" + suffix;
      await expect(service.isSensitiveRoute(path, "GET", path)).resolves.toBe(
        true,
      );
    },
  );
  it.each(["", "/count", "/" + demoId])(
    "preserves public author projections%s",
    async (suffix) => {
      const path = "/api/social/profiles/authors" + suffix;
      await expect(service.isSensitiveRoute(path, "GET", path)).resolves.toBe(
        false,
      );
    },
  );
});

describe("catalogue actor write boundaries", () => {
  const service = createService();
  const id = "00000000-0000-4000-8000-000000000001";
  it.each(["POST", "PATCH", "PUT", "DELETE"])(
    "requires roles for raw catalogue %s including ownership grants",
    async (method) => {
      for (const entity of [
        "stores",
        "products",
        "attributes",
        "attribute-keys",
        "stores-to-products",
        "offers-to-offers",
        "stores-to-attributes",
        "products-to-attributes",
        "stores-to-products-to-attributes",
        "attribute-keys-to-attributes",
        "attributes-to-billing-module-currencies",
      ]) {
        for (const suffix of ["", `/${id}`, "/bulk", "/find-or-create"]) {
          await expect(
            service.isSensitiveRoute(
              `/api/ecommerce/${entity}${suffix}`,
              method,
            ),
          ).resolves.toBe(true);
        }
        await expect(
          service.isSensitiveRoute(`/api/ecommerce/${entity}`, "GET"),
        ).resolves.toBe(false);
      }
      for (const entity of ["stores", "products", "orders"]) {
        await expect(
          service.isSensitiveRoute(
            `/api/rbac/subjects-to-ecommerce-module-${entity}/${id}`,
            method,
          ),
        ).resolves.toBe(true);
      }
    },
  );
  it("preserves public offer quotes and address suggestions", async () => {
    for (const operation of ["quote", "address-suggestions"]) {
      await expect(
        service.isSensitiveRoute(
          `/api/ecommerce/stores-to-products/${id}/${operation}`,
          "POST",
        ),
      ).resolves.toBe(false);
    }
  });
});
