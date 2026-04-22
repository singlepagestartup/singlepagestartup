/**
 * BDD Suite: fragment import guard.
 *
 * Given: the host route renders module fragments through remote fragment apps.
 * When: the host hot path and POC fragment apps are inspected.
 * Then: the host does not import module frontend components and POC apps keep module dependencies acyclic.
 */

import fs from "fs";
import path from "path";

const workspaceRoot = path.resolve(__dirname, "../../../..");

function readFiles(root: string) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      return readFiles(entryPath);
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      return [];
    }

    if (/\.(spec|test)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });
}

function fileContains(filePath: string, pattern: RegExp) {
  return pattern.test(fs.readFileSync(filePath, "utf8"));
}

describe("fragment import guard", () => {
  /**
   * BDD Scenario: host hot path stays free of module frontend imports.
   *
   * Given: apps/host owns cross-module composition.
   * When: the app route and fragment orchestrator source are scanned.
   * Then: ecommerce/rbac frontend component imports are absent.
   */
  it("keeps host route and fragment orchestrator free of module frontend components", () => {
    const files = [
      path.join(workspaceRoot, "apps/host/app/[[...url]]/page.tsx"),
      ...readFiles(path.join(workspaceRoot, "apps/host/src/fragments")),
    ];

    const offenders = files.filter((filePath) =>
      fileContains(filePath, /@sps\/(ecommerce|rbac)\/.*frontend\/component/),
    );

    expect(offenders).toEqual([]);
  });

  /**
   * BDD Scenario: temporary generated runtime is removed.
   *
   * Given: generated variant manifests were rejected for this migration.
   * When: the workspace is inspected.
   * Then: the temporary site runtime and generator script no longer exist.
   */
  it("removes the temporary generated site runtime", () => {
    expect(
      fs.existsSync(path.join(workspaceRoot, "apps/host/src/runtime/site")),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(
          workspaceRoot,
          "apps/host/scripts/generate-site-runtime-manifests.cjs",
        ),
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario: fragment JSON APIs are removed.
   *
   * Given: module fragments are rendered by App Router component routes.
   * When: the workspace is inspected.
   * Then: capabilities/query/render JSON API endpoints are absent.
   */
  it("removes fragment JSON API endpoints", () => {
    const apiRoutes = [
      "apps/ecommerce/app/api/sps/fragments/capabilities/route.ts",
      "apps/ecommerce/app/api/sps/fragments/query/route.ts",
      "apps/ecommerce/app/api/sps/fragments/render/route.ts",
      "apps/rbac/app/api/sps/fragments/capabilities/route.ts",
      "apps/rbac/app/api/sps/fragments/query/route.ts",
      "apps/rbac/app/api/sps/fragments/render/route.ts",
    ].map((filePath) => path.join(workspaceRoot, filePath));

    expect(apiRoutes.filter((filePath) => fs.existsSync(filePath))).toEqual([]);
  });
});
