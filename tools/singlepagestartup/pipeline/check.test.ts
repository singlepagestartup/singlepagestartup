/**
 * BDD Suite: Executable pre-development pipeline
 * Given the stage machine declares the structural rules of the workflow
 * When a workspace is checked against it
 * Then the report reproduces the stage, cursor and gaps without writing anything
 */

import { afterAll, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import path from "node:path";

import { loadDocumentReviews } from "../../studio/workspace/review-loader";
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
  /**
   * BDD Scenario: Declare every stage the cursor can name
   * Given the committed pipeline definition
   * When it is loaded
   * Then its stages, owners, templates and check kinds all resolve
   */
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
    expect(definition.legacy_shapes.length).toBeGreaterThan(0);
  });

  /**
   * BDD Scenario: Reject a definition that names an unknown role or check
   * Given a definition with an owner without a role file and an unknown check
   * When it is parsed
   * Then every failure is reported instead of a silent partial pipeline
   */
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
legacy_shapes: []
`;
    expect(() => parsePipelineDefinition(source, repositoryRoot)).toThrow(
      /role nobody|telepathy|cursor.stages order/,
    );
  });
});

describe("pipeline check on a downstream project", () => {
  /**
   * BDD Scenario: A complete downstream project reaches the end of the pipeline
   * Given a startup layer that owns and confirmed every shared document and product source
   * When the pipeline is checked as a downstream repository
   * Then every stage is complete and the computed cursor matches the recorded one
   */
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
      status: "complete",
      active_artifacts: [],
    });
    expect(report.cursor.consistent).toBe(true);
    expect(formatPipelineReport(report)).toContain("40-products complete");
  });

  /**
   * BDD Scenario: An unconfirmed Strategy blocks the stage it owns
   * Given the downstream Strategy has no startup confirmation
   * When the pipeline is checked
   * Then 10-strategy carries an approval gap and the computed cursor stops there as blocked
   */
  test("blocks at Strategy when the startup confirmation is missing", async () => {
    const { root } = await fixture(repositoryRoot, {
      confirm: { strategy: false },
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const strategy = report.stages.find((stage) => stage.id === "10-strategy")!;
    const gap = strategy.checks.find(
      (check) => check.id === "strategy.confirmed",
    )!;
    expect(gap.status).toBe("gap");
    expect(gap.classification).toBe("approval-gap");
    expect(report.cursor.computed.active_stage).toBe("10-strategy");
    expect(report.cursor.computed.status).toBe("blocked");
    expect(report.cursor.consistent).toBe(false);
    expect(
      report.stages.find((stage) => stage.id === "20-brand")!.complete,
    ).toBe(false);
  });

  /**
   * BDD Scenario: Inherited framework content never satisfies a startup gate
   * Given an empty startup layer over a populated framework base
   * When the pipeline is checked as a downstream repository
   * Then the scope gate fails in the startup layer even though the resolved Brief has sections
   */
  test("keeps an empty startup layer at Client Request", async () => {
    const { root } = await fixture(repositoryRoot, {
      populated: false,
      cursor: {
        active_stage: "00-business",
        status: "not_started",
        active_artifacts: ["brief"],
      },
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const business = report.stages.find((stage) => stage.id === "00-business")!;
    expect(
      business.checks.find((check) => check.id === "brief.sections")!.status,
    ).toBe("pass");
    const scope = business.checks.find(
      (check) => check.id === "brief.scope-confirmed",
    )!;
    expect(scope.status).toBe("gap");
    expect(scope.detail).toContain("inherited scope never satisfies");
    expect(report.cursor.computed.active_stage).toBe("00-business");
    expect(report.cursor.consistent).toBe(true);
  });

  /**
   * BDD Scenario: Design assets must exist and sales must be decided
   * Given a generated asset is registered without its file and the sales process is blocked
   * When the pipeline is checked
   * Then 30-design reports the missing file and 40-products reports a decision gap
   */
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
    expect(report.cursor.computed.active_stage).toBe("30-design");
  });

  /**
   * BDD Scenario: Legacy shapes are named, not silently tolerated
   * Given a v1 catalog and a retired evidence-register code in a document
   * When the pipeline is checked
   * Then both legacy shapes are reported with the procedure that migrates them
   */
  test("detects legacy shapes with their migration procedure", async () => {
    const { root } = await fixture(repositoryRoot, {
      baseCatalogSchema: "v1",
      evidenceCode: true,
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const ids = report.legacy_shapes.map((shape) => shape.id);
    expect(ids).toContain("catalog-v1");
    expect(ids).toContain("evidence-register-codes");
    expect(
      report.legacy_shapes.every((shape) =>
        shape.procedure.startsWith("migrations/"),
      ),
    ).toBe(true);
    expect(report.status).toBe("gaps");
  });

  /**
   * BDD Scenario: An unmigrated shape blocks the stage that reads those documents
   * Given a v1 catalog and a retired evidence-register code in a document
   * When the pipeline is checked
   * Then Client Request carries a structural gap per shape and no stage reports complete
   */
  test("turns a legacy shape into a structural gap of its owning stage", async () => {
    const { root } = await fixture(repositoryRoot, {
      baseCatalogSchema: "v1",
      evidenceCode: true,
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const business = report.stages.find((stage) => stage.id === "00-business")!;
    const gaps = business.checks.filter(
      (check) => check.check === "legacy-shape",
    );
    expect(gaps.map((check) => check.id).sort()).toEqual([
      "legacy.catalog-v1",
      "legacy.evidence-register-codes",
    ]);
    expect(
      gaps.every(
        (check) =>
          check.status === "gap" &&
          check.classification === "structural-gap" &&
          check.artifact === "workspace",
      ),
    ).toBe(true);
    expect(business.complete).toBe(false);
    expect(report.cursor.computed.active_stage).toBe("00-business");
    expect(report.summary.structural).toBeGreaterThanOrEqual(2);
    expect(
      report.legacy_shapes.every(
        (shape) => shape.owning_stage === "00-business",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario: A stamp stops meaning anything once its body changes
   * Given a Brief edited after the operator confirmed it
   * When the pipeline is checked
   * Then Client Request reports an approval gap that names the body, not the inputs
   */
  test("fails Client Request when the Brief stamp no longer covers its body", async () => {
    const { root } = await fixture(repositoryRoot, {
      editedAfterConfirmation: ["brief"],
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const stamp = report.stages
      .find((stage) => stage.id === "00-business")!
      .checks.find((check) => check.id === "brief.stamp-current")!;
    expect(stamp.status).toBe("gap");
    expect(stamp.classification).toBe("approval-gap");
    expect(stamp.detail).toContain("no longer covers the current body");
  });

  /**
   * BDD Scenario: An unstamped document has no stamp to invalidate
   * Given a Brief that was never confirmed
   * When the pipeline is checked
   * Then the stamp check passes and only the scope gate reports the missing approval
   */
  test("passes the stamp check when the Brief carries no confirmation", async () => {
    const { root } = await fixture(repositoryRoot, {
      confirm: { brief: false },
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const stamp = report.stages
      .find((stage) => stage.id === "00-business")!
      .checks.find((check) => check.id === "brief.stamp-current")!;
    expect(stamp.status).toBe("pass");
    expect(stamp.detail).toContain("no confirmation stamp to invalidate");
  });

  /**
   * BDD Scenario: Stale never hides the document's own state
   * Given a Strategy edited after confirmation whose inputs also moved
   * When the report explains the approval gap
   * Then it names the changed body beneath the stale inputs
   */
  test("names the underlying state beneath stale", async () => {
    const { root } = await fixture(repositoryRoot, {
      editedAfterConfirmation: ["strategy"],
      staleInputs: ["strategy"],
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
    });
    const strategy = report.stages
      .find((stage) => stage.id === "10-strategy")!
      .checks.find((check) => check.id === "strategy.confirmed")!;
    expect(strategy.status).toBe("gap");
    expect(strategy.detail).toContain("stale over changed");
  });

  /**
   * BDD Scenario: A registered directory covers the files below it
   * Given a registry entry whose path is a directory of generated files
   * When the generated assets are checked
   * Then those files are registered and no orphan is reported
   */
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

  /**
   * BDD Scenario: An inherited base section is named, not silently accepted
   * Given the framework Design keeps an interface section that the downstream Brief marks out of scope
   * When the pipeline is checked as a downstream repository
   * Then the resolved Design reports the inherited section and explains that startup cannot remove it
   */
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

  /**
   * BDD Scenario: Enforce mode exits non-zero on gaps while report mode does not
   * Given a project with an unconfirmed Brand
   * When the check runs in enforce mode
   * Then the report says enforce and carries the gap for the caller to fail on
   */
  test("marks enforce mode in the report", async () => {
    const { root } = await fixture(repositoryRoot, {
      confirm: { brand: false },
    });
    const report = await runPipelineCheck({
      repositoryRoot: root,
      repositoryIdentity: "example/downstream",
      enforce: true,
    });
    expect(report.mode).toBe("enforce");
    expect(report.status).toBe("gaps");
  });
});

describe("pipeline check on this repository", () => {
  /**
   * BDD Scenario: The framework workspace is evaluated with the same rules
   * Given the framework repository resolves to the singlepage layer
   * When the pipeline is checked
   * Then every confirmation check agrees with the shared review resolver
   */
  test("agrees with the review resolver on confirmation gates", async () => {
    const report = await runPipelineCheck({
      repositoryRoot,
      repositoryIdentity: "singlepagestartup/singlepagestartup",
    });
    expect(report.layer).toBe("singlepage");
    const reviews = await loadDocumentReviews(
      path.join(repositoryRoot, "apps/studio/workspace"),
      "singlepage",
    );
    for (const stage of report.stages) {
      for (const check of stage.checks.filter(
        (check) => check.check === "confirmed",
      )) {
        const state = reviews.get(check.artifact)!.confirmation.state;
        expect(check.status === "pass").toBe(state === "confirmed");
      }
    }
    expect(report.cursor.recorded.active_stage).toBeDefined();
    expect(
      report.stages
        .find((stage) => stage.id === "00-business")!
        .checks.every((check) => check.status !== "gap"),
    ).toBe(true);
  });
});
