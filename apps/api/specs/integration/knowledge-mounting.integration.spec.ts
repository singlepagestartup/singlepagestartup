/* eslint-disable quotes */
/**
 * BDD Suite: api/knowledge mounting integration.
 *
 * Given: the knowledge module exposes CRUD and RAG routes.
 * When: API host and module registry sources are inspected.
 * Then: the host and registry include the expected route surface.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("api/knowledge mounting integration", () => {
  /**
   * BDD Scenario: host mount.
   *
   * Given: the API host composes module applications.
   * When: app.ts is inspected.
   * Then: knowledge is mounted under `/api/knowledge`.
   */
  it("mounts knowledge module in api host", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    expect(appSource).toContain(
      `app.route("/api/knowledge", knowledgeApp.hono);`,
    );
  });

  /**
   * BDD Scenario: model registry.
   *
   * Given: the knowledge module has source and chunk models.
   * When: its apps registry is inspected.
   * Then: both model CRUD routes are present.
   */
  it("keeps source and chunk model routes in registry", () => {
    const appsSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/apps.ts",
      ),
      "utf-8",
    );

    expect(appsSource).toContain(`route: "/sources"`);
    expect(appsSource).toContain(`route: "/chunks"`);
  });

  /**
   * BDD Scenario: custom RAG routes.
   *
   * Given: knowledge exposes routes beyond CRUD.
   * When: its module app is inspected.
   * Then: search, generate, and index endpoints are registered.
   */
  it("registers custom knowledge routes", () => {
    const appSource = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/app.ts",
      ),
      "utf-8",
    );

    expect(appSource).toContain(`this.hono.post("/search"`);
    expect(appSource).toContain(`this.hono.post("/generate"`);
    expect(appSource).toContain(`this.hono.post("/index"`);
  });
});
