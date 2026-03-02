import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function extractRoutesFromAppsRegistry(source: string): string[] {
  const routes: string[] = [];
  const routeRegex = /route:\s*"([^"]+)"/g;

  let match: RegExpExecArray | null = routeRegex.exec(source);
  while (match) {
    routes.push(match[1]);
    match = routeRegex.exec(source);
  }

  return routes;
}

describe("api/ecommerce mounting integration", () => {
  it("mounts ecommerce module in api host", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    expect(appSource).toContain(
      'app.route("/api/ecommerce", ecommerceApp.hono);',
    );
  });

  it("keeps selected ecommerce resources in module apps registry", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/ecommerce/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );

    const routes = extractRoutesFromAppsRegistry(appsSource);
    const uniqueRoutes = new Set(routes);

    expect(uniqueRoutes.size).toBe(routes.length);
    expect(routes).toEqual(
      expect.arrayContaining([
        "/products",
        "/attributes",
        "/products-to-attributes",
      ]),
    );
  });

  it("keeps expected model/relation type for selected routes", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/ecommerce/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );

    expect(appsSource).toMatch(/type:\s*"model"[\s\S]*route:\s*"\/products"/);
    expect(appsSource).toMatch(/type:\s*"model"[\s\S]*route:\s*"\/attributes"/);
    expect(appsSource).toMatch(
      /type:\s*"relation"[\s\S]*route:\s*"\/products-to-attributes"/,
    );
  });
});
