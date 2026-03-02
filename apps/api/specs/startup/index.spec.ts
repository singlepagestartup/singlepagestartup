/**
 * BDD Suite: apps/api startup contract.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("apps/api startup contract", () => {
  it("mounts startup module route in api host", () => {
    const appSource = readFileSync(
      resolve(process.cwd(), "apps/api/app.ts"),
      "utf-8",
    );

    expect(appSource).toContain('app.route("/api/startup", startupApp.hono);');
  });
});
