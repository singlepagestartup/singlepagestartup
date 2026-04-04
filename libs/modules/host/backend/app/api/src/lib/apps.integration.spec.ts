/**
 * BDD Suite: host apps integration.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type AppEntry = {
  type: string;
  route: string;
};

function extractAppEntries(source: string): AppEntry[] {
  const entries: AppEntry[] = [];
  const entryRegex =
    /this\.apps\.push\(\{\s*type:\s*"([^"]+)"[\s\S]*?route:\s*"([^"]+)"/g;

  let match: RegExpExecArray | null = entryRegex.exec(source);
  while (match) {
    const [, type, route] = match;
    entries.push({ type, route });
    match = entryRegex.exec(source);
  }

  return entries;
}

describe("host apps integration", () => {
  it("keeps module apps registry non-empty", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/host/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );
    const entries = extractAppEntries(appsSource);

    expect(entries.length).toBeGreaterThan(0);
  });

  it("keeps module apps routes unique", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/host/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );
    const entries = extractAppEntries(appsSource);
    const routes = entries.map((entry) => entry.route);
    const uniqueRoutes = new Set(routes);

    expect(uniqueRoutes.size).toBe(routes.length);
  });

  it("keeps model/relation typing for each registered route", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/host/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );
    const entries = extractAppEntries(appsSource);

    expect(entries.every((entry) => entry.route.startsWith("/"))).toBe(true);
    expect(
      entries.every(
        (entry) => entry.type === "model" || entry.type === "relation",
      ),
    ).toBe(true);
  });
});
