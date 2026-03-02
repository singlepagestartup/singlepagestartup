import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("apps/api singlepage contract", () => {
  it("mounts ecommerce module route in api host", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    expect(appSource).toContain(
      'app.route("/api/ecommerce", ecommerceApp.hono);',
    );
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
    const authIndex = appSource.indexOf(
      "app.use(isAuthorizedMiddleware.init());",
    );
    const revalidationIndex = appSource.indexOf(
      "app.use(revalidationMiddleware.init());",
    );
    const parseQueryIndex = appSource.indexOf(
      "app.use(parseQueryMiddleware.init());",
    );

    expect(requestIdIndex).toBeGreaterThan(-1);
    expect(observerIndex).toBeGreaterThan(requestIdIndex);
    expect(authIndex).toBeGreaterThan(observerIndex);
    expect(revalidationIndex).toBeGreaterThan(authIndex);
    expect(parseQueryIndex).toBeGreaterThan(revalidationIndex);
  });
});
