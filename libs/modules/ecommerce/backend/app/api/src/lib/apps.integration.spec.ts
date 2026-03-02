import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function extractRoutes(source: string): string[] {
  const routes: string[] = [];
  const routeRegex = /route:\s*"([^"]+)"/g;

  let match: RegExpExecArray | null = routeRegex.exec(source);
  while (match) {
    routes.push(match[1]);
    match = routeRegex.exec(source);
  }

  return routes;
}

describe("ecommerce apps integration", () => {
  it("keeps selected routes in apps registry", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/ecommerce/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );
    const routes = extractRoutes(appsSource);

    expect(routes).toEqual(
      expect.arrayContaining([
        "/products",
        "/attributes",
        "/products-to-attributes",
      ]),
    );
  });

  it("keeps unique routes in apps registry", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/ecommerce/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );
    const routes = extractRoutes(appsSource);
    const uniqueRoutes = new Set(routes);

    expect(uniqueRoutes.size).toBe(routes.length);
  });

  it("keeps expected type mapping for selected routes", () => {
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
