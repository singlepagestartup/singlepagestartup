import path from "node:path";

import {
  resolveWorkspaceLayer,
  type WorkspaceLayer,
} from "../../studio/workspace/repository-layer";
import {
  loadPipelineContext,
  runStageChecks,
  type ICheckResult,
  type IPipelineCursor,
} from "./checks";
import { loadPipelineDefinition } from "./definition";
import { selectSection, type Section, type Progress } from "./selection";

export const PIPELINE_REPORT_SCHEMA = "singlepagestartup.pipeline-check.v2";

export interface IPipelineStageReport {
  id: string;
  title: string;
  owners: string[];
  active_artifacts: string[];
  /** Diagnostic result for this stage alone; never controls navigation. */
  complete: boolean;
  checks: ICheckResult[];
  manual_review: string[];
}

export interface IPipelineComputedCursor {
  active_stage: string;
  active_section: Section;
  active_product?: string;
  status: Progress;
  active_artifacts: string[];
}

export interface IPipelineReport {
  schema: typeof PIPELINE_REPORT_SCHEMA;
  status: "clean" | "gaps";
  mode: "report" | "enforce";
  layer: WorkspaceLayer;
  layer_source: "active-layer" | "repository-map" | "default";
  repository_identity: string | null;
  cursor: {
    path: string;
    recorded: IPipelineCursor;
    computed: IPipelineComputedCursor;
    consistent: boolean;
  };
  stages: IPipelineStageReport[];
  summary: {
    checks: number;
    passed: number;
    gaps: number;
    skipped: number;
    structural: number;
    decision: number;
  };
}

export interface IRunPipelineCheckOptions {
  repositoryRoot?: string;
  expectedLayer?: WorkspaceLayer;
  repositoryIdentity?: string;
  enforce?: boolean;
  section?: string;
  product?: string;
}

/** Evaluate every stage against the resolved workspace; nothing is written. */
export async function runPipelineCheck(
  options: IRunPipelineCheckOptions = {},
): Promise<IPipelineReport> {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? process.cwd());
  const definition = loadPipelineDefinition(repositoryRoot);
  const resolved = resolveWorkspaceLayer({
    repositoryRoot,
    repositoryIdentity: options.repositoryIdentity,
    requestedLayer: "auto",
  });
  if (options.expectedLayer && options.expectedLayer !== resolved.layer) {
    throw new Error(
      `Layer assertion ${options.expectedLayer} conflicts with repository layer ${resolved.layer}.`,
    );
  }
  const context = await loadPipelineContext({
    repositoryRoot,
    layer: resolved.layer,
    definition,
    repositoryIdentity: options.repositoryIdentity,
  });

  const stages: IPipelineStageReport[] = [];
  for (const stage of definition.stages) {
    const checks = [...(await runStageChecks(context, stage.checks))];
    const ownChecksPass = checks.every((check) => check.status !== "gap");
    const complete = ownChecksPass;
    stages.push({
      id: stage.id,
      title: stage.title,
      owners: stage.owners,
      active_artifacts: stage.active_artifacts,
      complete,
      checks,
      manual_review: stage.manual_review,
    });
  }
  const selection = selectSection(
    context.cursor as Record<string, unknown>,
    context.catalogLayer === context.layer
      ? context.catalog.products.map(({ id }) => id)
      : [],
    { section: options.section, product: options.product },
  );
  const computed: IPipelineComputedCursor = {
    active_stage: selection.active_stage,
    active_section: selection.active_section,
    ...(selection.active_product
      ? { active_product: selection.active_product }
      : {}),
    status: selection.status,
    active_artifacts:
      stages.find((stage) => stage.id === selection.active_stage)
        ?.active_artifacts ?? [],
  };

  const allChecks = stages.flatMap((stage) => stage.checks);
  const gaps = allChecks.filter((check) => check.status === "gap");
  const summary = {
    checks: allChecks.length,
    passed: allChecks.filter((check) => check.status === "pass").length,
    gaps: gaps.length,
    skipped: allChecks.filter((check) => check.status === "skipped").length,
    structural: gaps.filter(
      (check) => check.classification === "structural-gap",
    ).length,
    decision: gaps.filter((check) => check.classification === "decision-gap")
      .length,
  };

  return {
    schema: PIPELINE_REPORT_SCHEMA,
    status: gaps.length ? "gaps" : "clean",
    mode: options.enforce ? "enforce" : "report",
    layer: resolved.layer,
    layer_source: resolved.source,
    repository_identity: resolved.repositoryIdentity ?? null,
    cursor: {
      path: context.cursorPath,
      recorded: context.cursor,
      computed,
      consistent: context.cursor.active_stage === computed.active_stage,
    },
    stages,
    summary,
  };
}

export function formatPipelineReport(report: IPipelineReport): string {
  const lines: string[] = [];
  lines.push(
    `Pipeline check: layer ${report.layer} (${report.layer_source}), ${report.mode} mode, ${report.status}`,
  );
  const recorded = report.cursor.recorded;
  lines.push(
    `Cursor ${report.cursor.path}: recorded ${recorded.active_stage ?? "none"}/${recorded.status ?? "none"}, computed ${report.cursor.computed.active_stage}/${report.cursor.computed.status}${report.cursor.consistent ? "" : " (differs from the recorded stage)"}`,
  );
  for (const stage of report.stages) {
    const gaps = stage.checks.filter((check) => check.status === "gap");
    lines.push(
      `${stage.id} ${stage.complete ? "complete" : "incomplete"}: ${stage.checks.length} checks, ${gaps.length} advisory gap(s)`,
    );
    for (const check of gaps) {
      lines.push(`  - ${check.id} [${check.classification}] ${check.detail}`);
      for (const item of check.items ?? []) lines.push(`      ${item}`);
    }
    for (const check of stage.checks.filter(
      (check) => check.status === "skipped",
    ))
      lines.push(`  ~ ${check.id} skipped: ${check.detail}`);
  }
  const active = report.stages.find(
    (stage) => stage.id === report.cursor.computed.active_stage,
  );
  if (active?.manual_review.length) {
    lines.push(`Manual review for ${active.id}:`);
    for (const item of active.manual_review) lines.push(`  - ${item}`);
  }
  lines.push(
    `Summary: ${report.summary.passed} passed, ${report.summary.gaps} gaps (${report.summary.structural} structural, ${report.summary.decision} decision), ${report.summary.skipped} skipped`,
  );
  return lines.join("\n");
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (import.meta.main) {
  try {
    const layer = option("--layer");
    if (layer != null && layer !== "singlepage" && layer !== "startup") {
      throw new Error("--layer must be singlepage or startup when provided.");
    }
    const report = await runPipelineCheck({
      enforce: process.argv.includes("--enforce"),
      section: option("--section"),
      product: option("--product"),
      expectedLayer: layer as WorkspaceLayer | undefined,
      repositoryIdentity: option("--repository"),
      repositoryRoot: option("--repository-root"),
    });
    process.stdout.write(
      option("--format") === "text"
        ? `${formatPipelineReport(report)}\n`
        : `${JSON.stringify(report, null, 2)}\n`,
    );
    if (report.mode === "enforce" && report.status === "gaps")
      process.exitCode = 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(
      `${JSON.stringify({ status: "unavailable", error: message }, null, 2)}\n`,
    );
    process.exitCode = 1;
  }
}
