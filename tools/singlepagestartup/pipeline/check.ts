import path from "node:path";

import {
  resolveWorkspaceLayer,
  type WorkspaceLayer,
} from "../../studio/workspace/repository-layer";
import {
  detectLegacyShapes,
  loadPipelineContext,
  runStageChecks,
  type ICheckResult,
  type ILegacyShapeResult,
  type IPipelineCursor,
} from "./checks";
import { loadPipelineDefinition } from "./definition";

export const PIPELINE_REPORT_SCHEMA = "singlepagestartup.pipeline-check.v1";

export interface IPipelineStageReport {
  id: string;
  title: string;
  owners: string[];
  active_artifacts: string[];
  /** Own checks pass and every earlier stage is complete. */
  complete: boolean;
  /** Set when the stage's own checks pass but an earlier stage is incomplete. */
  blocked_by?: string;
  checks: ICheckResult[];
  manual_review: string[];
}

export interface IPipelineComputedCursor {
  active_stage: string;
  status: "in_progress" | "blocked" | "complete";
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
  legacy_shapes: ILegacyShapeResult[];
  summary: {
    checks: number;
    passed: number;
    gaps: number;
    skipped: number;
    structural: number;
    approval: number;
    decision: number;
    legacy: number;
  };
}

export interface IRunPipelineCheckOptions {
  repositoryRoot?: string;
  expectedLayer?: WorkspaceLayer;
  repositoryIdentity?: string;
  enforce?: boolean;
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
  let firstIncompleteId: string | undefined;
  for (const stage of definition.stages) {
    const checks = await runStageChecks(context, stage.checks);
    const ownChecksPass = checks.every((check) => check.status !== "gap");
    const complete = ownChecksPass && !firstIncompleteId;
    if (!complete && !firstIncompleteId) firstIncompleteId = stage.id;
    stages.push({
      id: stage.id,
      title: stage.title,
      owners: stage.owners,
      active_artifacts: stage.active_artifacts,
      complete,
      ...(ownChecksPass && !complete ? { blocked_by: firstIncompleteId } : {}),
      checks,
      manual_review: stage.manual_review,
    });
  }
  const legacyShapes = await detectLegacyShapes(
    context,
    definition.legacy_shapes,
  );

  const firstIncomplete = stages.find((stage) => !stage.complete);
  const computed: IPipelineComputedCursor = firstIncomplete
    ? {
        active_stage: firstIncomplete.id,
        status: firstIncomplete.checks.some(
          (check) =>
            check.status === "gap" && check.classification === "structural-gap",
        )
          ? "in_progress"
          : "blocked",
        active_artifacts: firstIncomplete.active_artifacts,
      }
    : {
        active_stage:
          stages[stages.length - 1]?.id ?? definition.cursor.stages.at(-1)!,
        status: "complete",
        active_artifacts: [],
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
    approval: gaps.filter((check) => check.classification === "approval-gap")
      .length,
    decision: gaps.filter((check) => check.classification === "decision-gap")
      .length,
    legacy: legacyShapes.length,
  };

  return {
    schema: PIPELINE_REPORT_SCHEMA,
    status: gaps.length || legacyShapes.length ? "gaps" : "clean",
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
    legacy_shapes: legacyShapes,
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
      `${stage.id} ${stage.complete ? "complete" : "incomplete"}: ${stage.checks.length} checks, ${gaps.length} gap(s)${stage.blocked_by ? `, own checks pass but ${stage.blocked_by} is incomplete` : ""}`,
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
  if (report.legacy_shapes.length) {
    lines.push("Legacy shapes:");
    for (const shape of report.legacy_shapes) {
      lines.push(`  - ${shape.id}: ${shape.detail}`);
      for (const item of shape.items) lines.push(`      ${item}`);
    }
  } else lines.push("Legacy shapes: none");
  const active = report.stages.find(
    (stage) => stage.id === report.cursor.computed.active_stage,
  );
  if (active?.manual_review.length) {
    lines.push(`Manual review for ${active.id}:`);
    for (const item of active.manual_review) lines.push(`  - ${item}`);
  }
  lines.push(
    `Summary: ${report.summary.passed} passed, ${report.summary.gaps} gaps (${report.summary.structural} structural, ${report.summary.approval} approval, ${report.summary.decision} decision), ${report.summary.skipped} skipped, ${report.summary.legacy} legacy shape(s)`,
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
