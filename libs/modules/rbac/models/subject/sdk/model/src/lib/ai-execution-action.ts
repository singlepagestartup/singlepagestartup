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
}

export interface IAiExecutionActionPayload {
  version: typeof AI_EXECUTION_ACTION_VERSION;
  runId: string;
  triggerMessageId: string;
  replySocialProfileId: string;
  status: TAiExecutionActionRunStatus;
  phase: TAiExecutionActionPhase;
  selectedModelId?: string;
  startedAt: string;
  completedAt?: string;
  steps: IAiExecutionActionStep[];
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
    !isBoundedString(value.triggerMessageId) ||
    !isBoundedString(value.replySocialProfileId) ||
    !includes(aiExecutionActionRunStatuses, value.status) ||
    !includes(aiExecutionActionPhases, value.phase) ||
    !isOptionalBoundedString(value.selectedModelId) ||
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
    triggerMessageId: value.triggerMessageId,
    replySocialProfileId: value.replySocialProfileId,
    status: value.status as TAiExecutionActionRunStatus,
    phase: value.phase as TAiExecutionActionPhase,
    ...(value.selectedModelId
      ? { selectedModelId: value.selectedModelId }
      : {}),
    startedAt: value.startedAt,
    ...(value.completedAt ? { completedAt: value.completedAt } : {}),
    steps: steps as IAiExecutionActionStep[],
  };
}
