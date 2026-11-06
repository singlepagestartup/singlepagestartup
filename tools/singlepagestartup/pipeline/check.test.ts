import { afterAll, describe, expect, test } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

import { formatPipelineReport, runPipelineCheck } from "./check";
import {
  CHECK_KINDS,
  loadPipelineDefinition,
  parsePipelineDefinition,
} from "./definition";
import { createDownstreamFixture } from "./fixture";

const repositoryRoot = process.cwd();
const created: string[] = [];

async function fixture(...args: Parameters<typeof createDownstreamFixture>) {
  const result = await createDownstreamFixture(...args);
  created.push(result.root);
  return result;
}

afterAll(() => {
  for (const root of created) rmSync(root, { recursive: true, force: true });
});

describe("pipeline definition", () => {
  test("loads with stages in cursor order and known check kinds", () => {
    const definition = loadPipelineDefinition(repositoryRoot);
    expect(definition.stages.map((stage) => stage.id)).toEqual(
      definition.cursor.stages,
    );
    const kinds = new Set(
      definition.stages.flatMap((stage) =>
        stage.checks.map((check) => check.check),
      ),
    );
    for (const kind of kinds) expect(CHECK_KINDS).toContain(kind);
    expect(definition.stages.every((stage) => stage.owners.length > 0)).toBe(
      true,
    );
    expect(kinds.has("confirmed")).toBe(false);
    expect(kinds.has("stamp-current")).toBe(false);
  });

  test("rejects unknown owners, checks and stage order", () => {
    const source = `schema: singlepagestartup.pre-development-pipeline.v1
cursor:
  path: apps/studio/workspace/utils/pre-development/<layer>.yaml
  schema: singlepagestartup.pre-development-state.v1
  stages: [00-business]
  statuses: [not_started]
  artifacts: [brief]
stages:
  - id: 10-strategy
    title: Strategy
    owners: [nobody]
    active_artifacts: [brief]
    checks:
      - { id: x, check: telepathy, artifact: brief }
`;
    expect(() => parsePipelineDefinition(source, repositoryRoot)).toThrow(
      /role nobody|telepathy|cursor.stages order/,
    );
  });
});

describe("pipeline check on a downstream project", () => {
  test("reports every stage complete for a fully owned startup layer", async () => {
    const { root } = await fixture(repositoryRoot);
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const gaps = report.stages.flatMap((stage) =>
      stage.checks.filter((check) => check.status === "gap"),
    );
    expect(
      gaps.map(
        (gap) => `${gap.id}: ${gap.detail} ${(gap.items ?? []).join("; ")}`,
      ),
    ).toEqual([]);
    expect(report.layer).toBe("startup");
    expect(report.status).toBe("clean");
    expect(report.cursor.computed).toEqual({
      active_stage: "40-products",
      active_section: "materials",
      active_product: "fixture-product",
      status: "in_progress",
      active_artifacts: ["products"],
    });
    expect(report.cursor.consistent).toBe(true);
    expect(formatPipelineReport(report)).toContain("40-products complete");
  });

  test("reports missing generated files and blocked sales processes", async () => {
    const { root } = await fixture(repositoryRoot, {
      missingGeneratedFile: true,
      salesReadiness: "blocked",
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const design = report.stages.find((stage) => stage.id === "30-design")!;
    const assets = design.checks.find(
      (check) => check.id === "assets.generated-registered",
    )!;
    expect(assets.status).toBe("gap");
    expect(assets.items?.join("\n")).toContain("does not exist");
    const products = report.stages.find((stage) => stage.id === "40-products")!;
    const sales = products.checks.find(
      (check) => check.id === "sales.readiness",
    )!;
    expect(sales.status).toBe("gap");
    expect(sales.classification).toBe("decision-gap");
    expect(sales.items?.join("\n")).toContain("Choose the price.");
    expect(report.cursor.computed.active_section).toBe("materials");
  });

  test("accepts a generated directory as covering its files", async () => {
    const { root } = await fixture(repositoryRoot, {
      generatedDirectory: true,
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const assets = report.stages
      .find((stage) => stage.id === "30-design")!
      .checks.find((check) => check.id === "assets.generated-registered")!;
    expect(assets.items ?? []).toEqual([]);
    expect(assets.status).toBe("pass");
  });

  test("names an inherited section that the startup layer cannot remove", async () => {
    const { root } = await fixture(repositoryRoot, {
      baseDesignInterface: true,
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const design = report.stages.find((stage) => stage.id === "30-design")!;
    const sections = design.checks.find(
      (check) => check.id === "design.sections",
    )!;
    expect(sections.status).toBe("gap");
    expect(sections.items?.join("\n")).toContain(
      "Interface and product surfaces (inherited from singlepage",
    );
  });

  test("marks enforce mode in the report", async () => {
    const { root } = await fixture(repositoryRoot);
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
      enforce: true,
    });
    expect(report.mode).toBe("enforce");
    expect(report.status).toBe("clean");
  });
});

describe("pipeline check on this repository", () => {
  test("does not require a shared model beside the products", async () => {
    const { root, workspaceRoot } = await fixture(repositoryRoot);
    const catalogPath = path.join(
      workspaceRoot,
      "products/startup/catalog.yaml",
    );
    const catalog = parse(readFileSync(catalogPath, "utf8")) as {
      models?: unknown[];
      products: Array<Record<string, unknown>>;
    };
    expect(catalog.models).toBeUndefined();
    expect(catalog.products.every((product) => !product.model)).toBe(true);

    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    expect(
      report.stages
        .flatMap((stage) => stage.checks)
        .filter((entry) => entry.status === "gap" && /model/.test(entry.id)),
    ).toEqual([]);
    expect(report.status).toBe("clean");
  });
});

// Missing approvals and edited inputs affect neither navigation nor other stages.
test("keeps the selected later section while earlier checks report gaps", async () => {
  const { root } = await fixture(repositoryRoot, {
    missingGeneratedFile: true,
  });
  const report = await runPipelineCheck({
    repositoryRoot: root,
    repositoryIdentity: "example/downstream",
    section: "materials",
    product: "fixture-product",
  });
  expect(report.cursor.computed.active_section).toBe("materials");
  expect(report.summary).not.toHaveProperty("approval");
  expect(report.stages.find((stage) => stage.id === "20-brand")!.complete).toBe(
    true,
  );
  expect(
    report.stages.find((stage) => stage.id === "30-design")!.complete,
  ).toBe(false);
  expect(report.stages.every((stage) => !("blocked_by" in stage))).toBe(true);
});
