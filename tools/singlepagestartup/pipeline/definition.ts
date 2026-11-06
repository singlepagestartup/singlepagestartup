import { canonicalHeading } from "../../studio/workspace/headings";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export const PIPELINE_DEFINITION_PATH = ".agents/pipeline/pre-development.yaml";
export const PIPELINE_SCHEMA = "singlepagestartup.pre-development-pipeline.v1";

export const CHECK_KINDS = [
  "sections",
  "frontmatter",
  "no-change-log",
  "framework-headings",
  "documents-formatted",
  "product-sections",
  "sales-v2",
  "visual-intake-ready",
  "design-sections",
  "generated-assets-registered",
  "media-examples",
  "brandbook-owned",
  "specimens-rendered",
  "specimen-catalogue",
  "catalog-structure",
  "sales-readiness",
] as const;
export type PipelineCheckKind = (typeof CHECK_KINDS)[number];

export const PIPELINE_ARTIFACTS = [
  "brief",
  "strategy",
  "brand",
  "design",
  "assets",
  "products",
] as const;
export type PipelineArtifact = (typeof PIPELINE_ARTIFACTS)[number];

export interface IPipelineCheck {
  id: string;
  check: PipelineCheckKind;
  artifact: PipelineArtifact;
  template?: string;
  keys?: string[];
}

export interface IPipelineStage {
  id: string;
  title: string;
  owners: string[];
  active_artifacts: string[];
  checks: IPipelineCheck[];
  manual_review: string[];
}

export interface IPipelineDefinition {
  schema: string;
  cursor: {
    path: string;
    schema: string;
    stages: string[];
    statuses: string[];
    artifacts: string[];
  };
  stages: IPipelineStage[];
}

export class PipelineDefinitionError extends Error {
  readonly failures: string[];

  constructor(failures: string[]) {
    super(
      `Pipeline definition is invalid:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
    this.name = "PipelineDefinitionError";
    this.failures = failures;
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function strings(value: unknown, field: string, failures: string[]): string[] {
  if (!Array.isArray(value)) {
    failures.push(`${field} must be an array`);
    return [];
  }
  const result = value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  if (result.length !== value.length)
    failures.push(`${field} must contain only non-empty strings`);
  return result;
}

/** Parse and validate the declarative stage machine; references must resolve. */
export function parsePipelineDefinition(
  source: string,
  repositoryRoot: string,
): IPipelineDefinition {
  const failures: string[] = [];
  const raw = parse(source) as unknown;
  const value = record(raw) ? raw : {};
  if (!record(raw)) failures.push("definition must be a YAML object");
  if (value.schema !== PIPELINE_SCHEMA)
    failures.push(`schema must be ${PIPELINE_SCHEMA}`);

  const cursorRaw = record(value.cursor) ? value.cursor : {};
  if (!record(value.cursor)) failures.push("cursor must be an object");
  const cursor = {
    path: typeof cursorRaw.path === "string" ? cursorRaw.path : "",
    schema: typeof cursorRaw.schema === "string" ? cursorRaw.schema : "",
    stages: strings(cursorRaw.stages, "cursor.stages", failures),
    statuses: strings(cursorRaw.statuses, "cursor.statuses", failures),
    artifacts: strings(cursorRaw.artifacts, "cursor.artifacts", failures),
  };
  if (!cursor.path.includes("<layer>"))
    failures.push("cursor.path must contain the <layer> placeholder");
  if (!cursor.schema) failures.push("cursor.schema must be a non-empty string");

  const stagesRaw = Array.isArray(value.stages) ? value.stages : [];
  if (!Array.isArray(value.stages)) failures.push("stages must be an array");
  const checkIds = new Set<string>();
  const agentsRoot = path.join(repositoryRoot, ".agents");
  const stages = stagesRaw.map((stageRaw, index): IPipelineStage => {
    const stage = record(stageRaw) ? stageRaw : {};
    const prefix = `stages[${index}]`;
    const id = typeof stage.id === "string" ? stage.id : "";
    if (!id) failures.push(`${prefix}.id must be a non-empty string`);
    const title = typeof stage.title === "string" ? stage.title : "";
    if (!title) failures.push(`${prefix}.title must be a non-empty string`);
    const owners = strings(stage.owners, `${prefix}.owners`, failures);
    for (const owner of owners) {
      if (!existsSync(path.join(agentsRoot, "roles", `${owner}.md`)))
        failures.push(
          `${prefix}.owners: role ${owner} has no .agents/roles file`,
        );
    }
    const activeArtifacts = strings(
      stage.active_artifacts,
      `${prefix}.active_artifacts`,
      failures,
    );
    for (const artifact of activeArtifacts) {
      if (!cursor.artifacts.includes(artifact))
        failures.push(
          `${prefix}.active_artifacts: ${artifact} is not a cursor artifact`,
        );
    }
    const checksRaw = Array.isArray(stage.checks) ? stage.checks : [];
    if (!Array.isArray(stage.checks))
      failures.push(`${prefix}.checks must be an array`);
    const checks = checksRaw.map((checkRaw, checkIndex): IPipelineCheck => {
      const check = record(checkRaw) ? checkRaw : {};
      const checkPrefix = `${prefix}.checks[${checkIndex}]`;
      const checkId = typeof check.id === "string" ? check.id : "";
      if (!checkId)
        failures.push(`${checkPrefix}.id must be a non-empty string`);
      else if (checkIds.has(checkId))
        failures.push(`${checkPrefix}.id ${checkId} is declared twice`);
      checkIds.add(checkId);
      const kind = check.check;
      if (!CHECK_KINDS.includes(kind as PipelineCheckKind))
        failures.push(
          `${checkPrefix}.check ${String(kind)} is not a known check`,
        );
      const artifact = check.artifact;
      if (!PIPELINE_ARTIFACTS.includes(artifact as PipelineArtifact))
        failures.push(
          `${checkPrefix}.artifact ${String(artifact)} is not a pipeline artifact`,
        );
      const template =
        typeof check.template === "string" ? check.template : undefined;
      if (template && !existsSync(path.join(agentsRoot, template)))
        failures.push(`${checkPrefix}.template ${template} does not exist`);
      const keys =
        check.keys === undefined
          ? undefined
          : strings(check.keys, `${checkPrefix}.keys`, failures);
      return {
        id: checkId,
        check: kind as PipelineCheckKind,
        artifact: artifact as PipelineArtifact,
        template,
        keys,
      };
    });
    const manualReview = strings(
      stage.manual_review ?? [],
      `${prefix}.manual_review`,
      failures,
    );
    return {
      id,
      title,
      owners,
      active_artifacts: activeArtifacts,
      checks,
      manual_review: manualReview,
    };
  });
  const stageIds = stages.map((stage) => stage.id);
  if (stageIds.join("|") !== cursor.stages.join("|"))
    failures.push("stages must appear in exactly the cursor.stages order");

  if (failures.length) throw new PipelineDefinitionError(failures);
  return {
    schema: PIPELINE_SCHEMA,
    cursor,
    stages,
  };
}

export function loadPipelineDefinition(
  repositoryRoot: string,
): IPipelineDefinition {
  const definitionPath = path.join(repositoryRoot, PIPELINE_DEFINITION_PATH);
  if (!existsSync(definitionPath))
    throw new PipelineDefinitionError([
      `${PIPELINE_DEFINITION_PATH} does not exist`,
    ]);
  return parsePipelineDefinition(
    readFileSync(definitionPath, "utf8"),
    repositoryRoot,
  );
}

/** Second-level headings of a template are its required sections. */
export function templateSections(
  repositoryRoot: string,
  template: string,
): string[] {
  const source = readFileSync(
    path.join(repositoryRoot, ".agents", template),
    "utf8",
  );
  return [...source.matchAll(/^## (.+)$/gm)].map((match) =>
    canonicalHeading(match[1]),
  );
}
