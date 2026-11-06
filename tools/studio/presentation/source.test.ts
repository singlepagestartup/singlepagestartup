import { expect, test } from "bun:test";
import path from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import { stringify } from "yaml";
import { presentationStoryTarget } from "./source";

test("exports an existing deck through its current product story", () => {
  const workspace = path.resolve(
    import.meta.dir,
    "../../../apps/studio/workspace",
  );
  const target = presentationStoryTarget(
    workspace,
    "singlepage",
    "singlepagestartup",
  );
  expect(target.storyId).toBe(
    "workspace-10-products-singlepage-singlepagestartup--product",
  );
  expect(target.source).toEndWith(
    "singlepagestartup/presentation/ProjectPresentation.tsx",
  );
  expect(() =>
    presentationStoryTarget(workspace, "singlepage", "absent"),
  ).toThrow("No presentation");
});

test("selects the startup catalog atomically and inherits only when it is empty", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "sps-export-source-"));
  const product = (id: string) => ({
    id,
    name: id,
    summary: id,
    product: `${id}/product.md`,
    audience: `${id}/audience.md`,
    competitors: `${id}/competitors.md`,
    semantics: `${id}/semantics.md`,
    economics: `${id}/economics.md`,
    sales: `${id}/sales.yaml`,
    presentation: `${id}/Deck.tsx`,
  });
  const write = (layer: string, products: unknown[]) => {
    mkdirSync(path.join(root, "products", layer), { recursive: true });
    writeFileSync(
      path.join(root, "products", layer, "catalog.yaml"),
      stringify({ schema: "singlepagestartup.product-catalog.v2", products }),
    );
  };
  try {
    write("singlepage", [product("framework")]);
    write("startup", []);
    expect(presentationStoryTarget(root, "startup").storyId).toBe(
      "workspace-10-products-singlepage-framework--product",
    );
    write("startup", [product("client")]);
    expect(presentationStoryTarget(root, "startup").storyId).toBe(
      "workspace-10-products-startup-client--product",
    );
    expect(() => presentationStoryTarget(root, "startup", "framework")).toThrow(
      "No presentation",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
