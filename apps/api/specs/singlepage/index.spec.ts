/**
 * BDD Suite: apps/api singlepage contract.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("apps/api singlepage contract", () => {
  it("mounts ecommerce module route in api host", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    expect(appSource).toContain("ecommerce: ecommerceApp");
    expect(appSource).toContain('app.route("/api/" + name, module.hono)');
  });

  it("keeps critical middlewares in expected order", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    const requestIdIndex = appSource.indexOf(
      "app.use(new RequestIdMiddleware().init());",
    );
    const observerIndex = appSource.indexOf(
      "app.use(new ObserverMiddleware().init());",
    );
    const revalidationIndex = appSource.indexOf(
      "app.use(revalidationMiddleware.init());",
    );
    const httpCacheIndex = appSource.indexOf(
      "app.use(httpCacheMiddleware.init());",
    );
    const authIndex = appSource.indexOf(
      "app.use(new IsAuthorizedMiddleware().init());",
    );
    const parseQueryIndex = appSource.indexOf(
      "app.use(new ParseQueryMiddleware().init());",
    );

    expect(requestIdIndex).toBeGreaterThan(-1);
    expect(observerIndex).toBeGreaterThan(requestIdIndex);

    // Authorization and parsed query scope must run before any cache hit.
    expect(revalidationIndex).toBeGreaterThan(-1);
    expect(httpCacheIndex).toBeGreaterThan(-1);
    expect(revalidationIndex).toBeLessThan(httpCacheIndex);

    expect(authIndex).toBeLessThan(httpCacheIndex);
    expect(parseQueryIndex).toBeGreaterThan(authIndex);
    expect(parseQueryIndex).toBeLessThan(httpCacheIndex);
  });

  /**
   * BDD Scenario: production migrations finish before the API starts.
   *
   * Given: a production API container starts and applies repository migrations.
   * When: the startup script launches both processes.
   * Then: migrations finish before the API initializes consistency capture.
   */
  it("waits for production migrations before starting the API", () => {
    const startSource = readFileSync(
      resolve(process.cwd(), "start.sh"),
      "utf-8",
    );

    expect(startSource).toContain("./migrate.sh seed\n");
    expect(startSource).not.toContain("./migrate.sh seed &");
    expect(startSource.indexOf("./migrate.sh seed")).toBeLessThan(
      startSource.indexOf("npm run api:start"),
    );
  });
});
