export const AI_EXECUTION_ACTION_VARIANT = "ai-execution" as const;
export const AI_EXECUTION_ACTION_VERSION = 1 as const;
export const AI_EXECUTION_ACTION_MAX_STEPS = 20;

export const aiExecutionActionRunStatuses = [
  "running",
  "completed",
  "failed",
  "stopped",
] as const;

export const aiExecutionActionPhases = [
  "reply_generation",
  "tool_requested",
  "tool_running",
  "tool_completed",
  "finalizing",
] as const;

export const aiExecutionActionStepStatuses = [
  "requested",
  "running",
  "succeeded",
  "failed",
] as const;

export const aiExecutionActionStepKinds = [
  "skill",
  "knowledge",
  "mcp",
  "context",
] as const;

export type TAiExecutionActionRunStatus =
  (typeof aiExecutionActionRunStatuses)[number];
export type TAiExecutionActionPhase = (typeof aiExecutionActionPhases)[number];
export type TAiExecutionActionStepStatus =
  (typeof aiExecutionActionStepStatuses)[number];
export type TAiExecutionActionStepKind =
  (typeof aiExecutionActionStepKinds)[number];

export interface IAiExecutionActionStep {
  id: string;
  kind: TAiExecutionActionStepKind;
  serverId?: string;
  toolName: string;
  label: string;
  status: TAiExecutionActionStepStatus;
  startedAt?: string;
  completedAt?: string;
  resultBytes?: number;
  errorCode?: string;
  parameters?: Record<string, string | number | boolean>;
  resultSummary?: Record<string, number | boolean>;
  schemaFields?: { name: string; type: string }[];
}

/** The timeline can be shared with other participants. Only project explicitly public scalar fields. */
export function publicMcpParameters(input: unknown) {
  if (!isRecord(input)) return undefined;
  const result: NonNullable<IAiExecutionActionStep["parameters"]> = {};
  for (const key of [
    "module",
    "model",
    "relation",
    "moduleName",
    "modelName",
    "relationName",
    "sku",
    "locale",
  ]) {
    const value = input[key];
    if (
      typeof value === "string" &&
      /^[\p{L}\d_-]{1,40}$/u.test(value) &&
      !/^(?:sk-|gh[pousr]_|github_pat_|xox[baprs]-|AKIA|eyJ|Bearer)/i.test(
        value,
      )
    ) {
      result[key] = value;
    }
  }
  for (const key of ["limit", "offset", "page", "pageSize"]) {
    const value = input[key];
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
      result[key] = value;
  }
  if (typeof input.dryRun === "boolean") result.dryRun = input.dryRun;
  return Object.keys(result).length ? result : undefined;
}

export function publicMcpResult(input: unknown) {
  if (Array.isArray(input)) return { count: input.length };
  if (!isRecord(input)) return undefined;
  const result: NonNullable<IAiExecutionActionStep["resultSummary"]> = {};
  for (const key of [
    "count",
    "total",
    "available",
    "quantity",
    "created",
    "updated",
    "deleted",
    "ok",
    "success",
    "hasMore",
  ]) {
    const value = input[key];
    if (
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    )
      result[key] = value;
  }
  for (const key of [
    "items",
    "records",
    "results",
    "modules",
    "models",
    "relations",
  ]) {
    const values = input[key];
    if (Array.isArray(values) && result.count === undefined)
      result.count = values.length;
  }
  return Object.keys(result).length ? result : undefined;
}

export function publicMcpSchemaFields(
  server: unknown,
  tool: unknown,
  input: unknown,
) {
  if (
    server !== "singlepagestartup" ||
    (tool !== "model-schema" && tool !== "relation-schema") ||
    !isRecord(input) ||
    !Array.isArray(input.fields)
  ) {
    return undefined;
  }
  const fields: NonNullable<IAiExecutionActionStep["schemaFields"]> = [];
  for (const field of input.fields.slice(0, 24)) {
    if (
      isRecord(field) &&
      typeof field.name === "string" &&
      /^[a-z][A-Za-z0-9_]{0,63}$/.test(field.name) &&
      typeof field.type === "string" &&
      [
        "string",
        "number",
        "boolean",
        "date",
        "array",
        "record",
        "object",
        "enum",
        "literal",
        "unknown",
        "uuid",
        "text",
        "timestamp",
        "json",
      ].includes(field.type)
    ) {
      fields.push({ name: field.name, type: field.type });
    }
  }
  return fields.length ? fields : undefined;
}

export interface IAiExecutionActionPayload {
  version: typeof AI_EXECUTION_ACTION_VERSION;
  runId: string;
  triggerMessageId?: string;
  replySocialProfileId: string;
  status: TAiExecutionActionRunStatus;
  phase: TAiExecutionActionPhase;
  selectedModelId?: string;
  rejectedFileName?: string;
  startedAt: string;
  completedAt?: string;
  steps: IAiExecutionActionStep[];
}

/**
 * Converts the collision-safe function name used at the model boundary into a
 * transport-safe display name. The server is rendered separately, so the MCP
 * namespace would otherwise be duplicated in user-visible progress.
 */
export function formatAiExecutionActionStepToolName(
  step: Pick<IAiExecutionActionStep, "kind" | "serverId" | "toolName">,
) {
  let toolName = step.toolName.trim();

  if (step.kind === "mcp") {
    const prefix = step.serverId ? `mcp__${step.serverId}__` : "";

    if (prefix && toolName.toLowerCase().startsWith(prefix.toLowerCase())) {
      toolName = toolName.slice(prefix.length);
    } else {
      const namespaceParts = toolName.split("__");

      if (
        namespaceParts.length >= 3 &&
        namespaceParts[0]?.toLowerCase() === "mcp"
      ) {
        toolName = namespaceParts.slice(2).join("__");
      }
    }
  }

  const displayName = toolName
    .replace(/_+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  return displayName || "tool";
}

interface IActionLike {
  variant?: unknown;
  payload?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength = 256): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    value.trim() === value
  );
}

function isOptionalBoundedString(value: unknown, maxLength = 256) {
  return value === undefined || isBoundedString(value, maxLength);
}

function isIsoDate(value: unknown): value is string {
  return (
    isBoundedString(value, 64) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isOptionalIsoDate(value: unknown) {
  return value === undefined || isIsoDate(value);
}

function includes<T extends string>(values: readonly T[], value: unknown) {
  return typeof value === "string" && values.includes(value as T);
}

function parseStep(value: unknown): IAiExecutionActionStep | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isBoundedString(value.id) ||
    !includes(aiExecutionActionStepKinds, value.kind) ||
    !isOptionalBoundedString(value.serverId) ||
    !isBoundedString(value.toolName) ||
    !isBoundedString(value.label) ||
    !includes(aiExecutionActionStepStatuses, value.status) ||
    !isOptionalIsoDate(value.startedAt) ||
    !isOptionalIsoDate(value.completedAt) ||
    (value.resultBytes !== undefined &&
      (typeof value.resultBytes !== "number" ||
        !Number.isInteger(value.resultBytes) ||
        value.resultBytes < 0)) ||
    !isOptionalBoundedString(value.errorCode, 128)
  ) {
    return null;
  }

  return {
    id: value.id,
    kind: value.kind as TAiExecutionActionStepKind,
    ...(value.serverId ? { serverId: value.serverId } : {}),
    toolName: value.toolName,
    label: value.label,
    status: value.status as TAiExecutionActionStepStatus,
    ...(value.startedAt ? { startedAt: value.startedAt } : {}),
    ...(value.completedAt ? { completedAt: value.completedAt } : {}),
    ...(typeof value.resultBytes === "number"
      ? { resultBytes: value.resultBytes }
      : {}),
    ...(value.errorCode ? { errorCode: value.errorCode } : {}),
    ...(value.kind === "mcp" && {
      ...(value.parameters !== undefined && {
        parameters: publicMcpParameters(value.parameters),
      }),
      ...(value.resultSummary !== undefined && {
        resultSummary: publicMcpResult(value.resultSummary),
      }),
      ...(value.schemaFields !== undefined && {
        schemaFields: publicMcpSchemaFields(value.serverId, value.toolName, {
          fields: value.schemaFields,
        }),
      }),
    }),
  };
}

/**
 * Parses the RBAC-owned presentation projection stored in a generic Social
 * action. Invalid or unsupported data fails closed so UI code never dumps the
 * raw payload as a fallback.
 */
export function parseAiExecutionActionPayload(
  action: IActionLike,
): IAiExecutionActionPayload | null {
  if (action.variant !== AI_EXECUTION_ACTION_VARIANT) {
    return null;
  }

  const value = action.payload;

  if (
    !isRecord(value) ||
    value.version !== AI_EXECUTION_ACTION_VERSION ||
    !isBoundedString(value.runId) ||
    (!(
      value.phase === "reply_generation" && value.triggerMessageId === undefined
    ) &&
      !isBoundedString(value.triggerMessageId)) ||
    !isBoundedString(value.replySocialProfileId) ||
    !includes(aiExecutionActionRunStatuses, value.status) ||
    !includes(aiExecutionActionPhases, value.phase) ||
    !isOptionalBoundedString(value.selectedModelId) ||
    !isOptionalBoundedString(value.rejectedFileName) ||
    !isIsoDate(value.startedAt) ||
    !isOptionalIsoDate(value.completedAt) ||
    !Array.isArray(value.steps) ||
    value.steps.length > AI_EXECUTION_ACTION_MAX_STEPS
  ) {
    return null;
  }

  const steps = value.steps.map(parseStep);

  if (steps.some((step) => !step)) {
    return null;
  }

  return {
    version: AI_EXECUTION_ACTION_VERSION,
    runId: value.runId,
    ...(typeof value.triggerMessageId === "string" && {
      triggerMessageId: value.triggerMessageId,
    }),
    replySocialProfileId: value.replySocialProfileId,
    status: value.status as TAiExecutionActionRunStatus,
    phase: value.phase as TAiExecutionActionPhase,
    ...(value.rejectedFileName
      ? { rejectedFileName: value.rejectedFileName }
      : {}),
    ...(value.selectedModelId
      ? { selectedModelId: value.selectedModelId }
      : {}),
    startedAt: value.startedAt,
    ...(value.completedAt ? { completedAt: value.completedAt } : {}),
    steps: steps as IAiExecutionActionStep[],
  };
}
