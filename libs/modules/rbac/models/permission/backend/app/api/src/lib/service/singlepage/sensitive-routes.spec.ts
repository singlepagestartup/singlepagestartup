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
