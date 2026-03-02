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
