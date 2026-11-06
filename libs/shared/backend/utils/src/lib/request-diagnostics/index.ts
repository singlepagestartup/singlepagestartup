import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { rbacSecretMatches } from "../rbac-secret";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function diagnosticId(value: unknown): string | undefined {
  if (typeof value === "string" && uuid.test(value)) {
    return value;
  }
  return undefined;
}

interface IRequestDiagnostics {
  requestId: string;
  traceId: string;
  parentRequestId?: string;
  startedAt: number;
  operation?: {
    stage: string;
    attachmentCount?: number;
    attachmentBytes?: number;
    attachmentTypes?: string[];
  };
}
const requests = new AsyncLocalStorage<IRequestDiagnostics>();

export function requestDiagnostics(c: Context): IRequestDiagnostics {
  const existing = c.get("spsRequestDiagnostics") as
    | IRequestDiagnostics
    | undefined;
  if (existing) {
    return existing;
  }
  const requestId = randomUUID();
  const context: IRequestDiagnostics = {
    requestId,
    traceId: requestId,
    startedAt: performance.now(),
  };
  const parent = diagnosticId(c.req.header("X-SPS-Parent-Request-Id"));
  const trace = diagnosticId(c.req.header("X-SPS-Trace-Id"));
  if (trace && parent && rbacSecretMatches(c.req.header("X-RBAC-SECRET-KEY"))) {
    context.traceId = trace;
    context.parentRequestId = parent;
  }
  c.set("spsRequestDiagnostics", context);
  return context;
}

export function runWithRequestDiagnostics(
  c: Context,
  next: () => Promise<void>,
) {
  return requests.run(requestDiagnostics(c), next);
}

export function currentRequestDiagnostics() {
  return requests.getStore();
}
