import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import { selectSection, selectWorkspaceSection } from "./selection";

describe("section navigation", () => {
  test("resumes the explicitly saved section", () => {
    const state = selectSection(
      {
        schema: "singlepagestartup.pre-development-state.v2",
        active_section: "design",
        status: "in_progress",
      },
      [],
    );
    expect(state.active_section).toBe("design");
    expect(state.status).toBe("in_progress");
    expect(state).not.toHaveProperty("blockers");
    expect(selectSection(state, []).active_section).toBe("design");
  });
  test("starts a new project at Brief and honors explicit section selection", () => {
    expect(selectSection({}, []).active_section).toBe("brief");
    const state = selectSection({}, ["a", "b"], {
      section: "semantics",
      product: "b",
    });
    expect(state.active_section).toBe("semantics");
    expect(state.active_product).toBe("b");
    expect(state.active_stage).toBe("05-products");
  });
  test("skips only the selected product and reopens it explicitly", () => {
    const skipped = selectSection({}, ["a", "b"], {
      section: "semantics",
      product: "a",
      skip: true,
    });
    expect(skipped.active_section).toBe("strategy");
    expect(skipped.progress["semantics:a"]).toBe("skipped");
    expect(skipped.progress["semantics:b"]).toBeUndefined();
    const reopened = selectSection(skipped, ["a", "b"], {
      section: "semantics",
      product: "a",
    });
    expect(reopened.status).toBe("in_progress");
  });
  test("allows an empty product catalog to be skipped without creating a product", () => {
    const skipped = selectSection({}, [], { section: "products", skip: true });
    expect(skipped.progress.products).toBe("skipped");
    expect(skipped.active_section).toBe("competitors");
    expect(skipped.active_product).toBeUndefined();
    expect(
      selectSection(skipped, [], { section: "design" }).active_section,
    ).toBe("design");
  });
  test("does not select one of several products silently", () => {
    expect(
      selectSection({}, ["a", "b"], { section: "products" }).active_product,
    ).toBeUndefined();
    expect(() =>
      selectSection({}, ["a", "b"], { section: "products", skip: true }),
    ).toThrow("--product");
    expect(() => selectSection({}, ["a"], { product: "../b" })).toThrow(
      "Unknown product",
    );
    expect(() => selectSection({}, [], { section: "unknown" })).toThrow(
      "Unknown section",
    );
    expect(() => selectSection({}, [], { skip: true, next: true })).toThrow(
      "only one",
    );
  });
  test("marks preparation without manufacturing a review or moving automatically on resume", () => {
    const state = selectSection({}, ["a"], {
      section: "products",
      complete: true,
    });
    expect(state.progress["products:a"]).toBe("prepared");
    expect(state.active_section).toBe("competitors");
    expect(state).not.toHaveProperty("confirmation");
    expect(selectSection(state, ["a"]).active_section).toBe("competitors");
  });
  test("writes only the owning layer and never inspects missing unrelated documents", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "sps-selection-"));
    const workspace = path.join(root, "apps/studio/workspace");
    try {
      mkdirSync(path.join(workspace, "utils/pre-development"), {
        recursive: true,
      });
      mkdirSync(path.join(workspace, "products/startup"), { recursive: true });
      writeFileSync(
        path.join(workspace, "utils/config.yaml"),
        "schema: singlepagestartup.workspace-config.v1\ndefault_layer: startup\n",
      );
      writeFileSync(
        path.join(workspace, "utils/pre-development/singlepage.yaml"),
        "preserve framework state\n",
      );
      writeFileSync(
        path.join(workspace, "products/startup/catalog.yaml"),
        stringify({
          schema: "singlepagestartup.product-catalog.v2",
          products: [
            {
              id: "own",
              name: "Own",
              summary: "Customer product",
              product: "own/product.md",
              audience: "own/audience.md",
              competitors: "own/competitors.md",
              semantics: "own/semantics.md",
              economics: "own/economics.md",
              sales: "own/sales.yaml",
            },
          ],
        }),
      );
      const result = selectWorkspaceSection({
        repositoryRoot: root,
        repositoryIdentity: "example/customer",
        section: "semantics",
        product: "own",
      });
      expect(result.layer).toBe("startup");
      expect(
        selectWorkspaceSection({
          repositoryRoot: root,
          repositoryIdentity: "example/customer",
        }).state.active_section,
      ).toBe("semantics");
      expect(
        readFileSync(
          path.join(workspace, "utils/pre-development/singlepage.yaml"),
          "utf8",
        ),
      ).toBe("preserve framework state\n");
      const before = readFileSync(path.join(root, result.file), "utf8");
      expect(() =>
        selectWorkspaceSection({
          repositoryRoot: root,
          repositoryIdentity: "example/customer",
          product: "foreign",
        }),
      ).toThrow();
      expect(readFileSync(path.join(root, result.file), "utf8")).toBe(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
