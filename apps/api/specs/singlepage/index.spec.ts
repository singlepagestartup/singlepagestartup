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

    const ecommerceRoute =
      "app.route(" + JSON.stringify("/api/ecommerce") + ", ecommerceApp.hono);";

    expect(appSource).toContain(ecommerceRoute);
  });

  it("keeps critical middlewares in expected order", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    const requestIdIndex = appSource.indexOf(
      "app.use(requestIdMiddleware.init());",
    );
    const observerIndex = appSource.indexOf(
      "app.use(observerMiddleware.init());",
    );
    const revalidationIndex = appSource.indexOf(
      "app.use(revalidationMiddleware.init());",
    );
    const httpCacheIndex = appSource.indexOf(
      "app.use(httpCacheMiddleware.init());",
    );
    const authIndex = appSource.indexOf(
      "app.use(isAuthorizedMiddleware.init());",
    );
    const parseQueryIndex = appSource.indexOf(
      "app.use(parseQueryMiddleware.init());",
    );

    expect(requestIdIndex).toBeGreaterThan(-1);
    expect(observerIndex).toBeGreaterThan(requestIdIndex);

    // Issue-195 bump-before-broadcast contract (LOAD-BEARING ORDER).
    //
    // Hono middleware is an onion: code after `await next()` unwinds in
    // REVERSE registration order (the LAST-registered middleware's post-next
    // block runs FIRST). The http-cache middleware AWAITS its cache-version
    // bump after next(); the revalidation middleware fires the WebSocket
    // broadcast after next() (not awaited for cache).
    //
    // If revalidation were registered AFTER http-cache, its broadcast would
    // unwind BEFORE http-cache finished bumping — clients would be told "data
    // changed" and immediately refetch a STILL-STALE cached read. Registering
    // revalidation BEFORE http-cache makes the http-cache bump (inner) complete
    // before the revalidation broadcast (outer) runs. Do NOT reorder these.
    expect(revalidationIndex).toBeGreaterThan(-1);
    expect(httpCacheIndex).toBeGreaterThan(-1);
    expect(revalidationIndex).toBeLessThan(httpCacheIndex);

    expect(authIndex).toBeGreaterThan(httpCacheIndex);
    expect(parseQueryIndex).toBeGreaterThan(authIndex);
  });

  /**
   * BDD Scenario: production migrations run without blocking the API.
   *
   * Given: a production API container starts and applies repository migrations.
   * When: the startup script launches both processes.
   * Then: migrations run in the background while the API remains the foreground process.
   */
  it("starts the production API without waiting for migrations", () => {
    const startSource = readFileSync(
      resolve(process.cwd(), "start.sh"),
      "utf-8",
    );

    expect(startSource).toContain("./migrate.sh seed &");
    expect(startSource.indexOf("./migrate.sh seed &")).toBeLessThan(
      startSource.indexOf("npm run api:start"),
    );
  });
});
