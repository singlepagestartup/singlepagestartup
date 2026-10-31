/**
 * BDD Suite: module application boilerplate.
 * Given: an Nx workspace with an API composition entrypoint.
 * When: a module is generated.
 * Then: its App inherits shared composition and bootstrap exposes an interface.
 */
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { moduleGenerator } from "./generator";
import { readFileSync } from "node:fs";
import path from "node:path";

it("generates a module using ModuleApp and its typed public interface", async () => {
  const tree = createTreeWithEmptyWorkspace();
  tree.write(
    "tsconfig.base.json",
    JSON.stringify({ compilerOptions: { paths: {} } }),
  );
  tree.write(
    "apps/api/app.ts",
    readFileSync(
      path.resolve(__dirname, "../../../../../../apps/api/app.ts"),
      "utf8",
    ),
  );
  const previous = process.env.NX_DRY_RUN;
  process.env.NX_DRY_RUN = "true";
  try {
    await moduleGenerator(tree, { module: "probe", action: "create" });
  } finally {
    if (previous === undefined) delete process.env.NX_DRY_RUN;
    else process.env.NX_DRY_RUN = previous;
  }
  const root = "libs/modules/probe/backend/app/api/src/lib";
  const app = tree.read(`${root}/app.ts`)!.toString();
  expect(app).toContain("extends ModuleApp<Apps>");
  expect(app).not.toContain("describeRoutes()");
  const bootstrap = tree.read(`${root}/bootstrap.ts`)!.toString();
  expect(bootstrap).toContain("container.get<IModuleApp<Apps>>(DI.IApp)");
  expect(bootstrap).not.toContain("container.get<App>");
  const composition = tree.read("apps/api/app.ts")!.toString();
  expect(composition).toContain('"probe": probeApp,');
  expect(composition).toContain("export const app = new Hono<Env>()");
  expect(composition).not.toContain('app.route("/api/probe"');
  const project = JSON.parse(
    tree.read("libs/modules/probe/project.json")!.toString(),
  );
  for (const name of [
    "repository-generate",
    "models:repository-generate",
    "relations:repository-generate",
  ])
    expect(project.targets[name].cache).toBe(false);
});
