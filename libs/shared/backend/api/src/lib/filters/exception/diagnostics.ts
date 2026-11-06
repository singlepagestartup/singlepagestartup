import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { routePath } from "hono/route";
import {
  diagnosticId,
  failureLocations,
  rbacSecretMatches,
  readRbacSecret,
  requestDiagnostics,
  verifyJwt,
} from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";

async function actor(c: Context) {
  if (rbacSecretMatches(readRbacSecret(c))) {
    return { actor: "operator" };
  }
  const cookie = getCookie(c, "rbac.subject.jwt");
  const bearer = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  const token = cookie || bearer;
  if (!token) {
    return { actor: "anonymous" };
  }
  if (
    !RBAC_JWT_SECRET ||
    token.length > 8192 ||
    (cookie && bearer && cookie !== bearer)
  ) {
    return { actor: "unverified" };
  }
  try {
    const payload = await verifyJwt(token, RBAC_JWT_SECRET);
    const subject = payload.subject;
    if (!subject || typeof subject !== "object" || !("id" in subject)) {
      return { actor: "unverified" };
    }
    const subjectId = diagnosticId(subject.id);
    if (subjectId) {
      return { actor: "subject", subjectId };
    }
  } catch {
    // Invalid and expired credentials provide no identity for diagnostics.
  }
  return { actor: "unverified" };
}

function failureReason(message: string) {
  if (message.includes("Invalid JSON in body")) {
    return "invalid_json";
  }
  if (message.includes("Token expired")) {
    return "token_expired";
  }
  if (message.includes("Invalid token")) {
    return "invalid_token";
  }
  if (message.includes("Entity already exists")) {
    return "duplicate_entity";
  }
  return undefined;
}

const httpMethods = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "CONNECT",
  "TRACE",
]);
export async function errorEvent(
  c: Context,
  error: Error,
  status: number,
  category: string,
) {
  const context = requestDiagnostics(c);
  const cause = error.cause as { requestId?: unknown } | undefined;
  const ids: Record<string, string> = {};
  for (const [name, value] of Object.entries(c.req.param())) {
    if (/^(?:id|\w+Id)$/.test(name) && diagnosticId(value)) {
      ids[name] = value;
    }
  }
  return {
    event: "api.error",
    occurredAt: new Date().toISOString(),
    requestId: context.requestId,
    traceId: context.traceId,
    parentRequestId: context.parentRequestId,
    downstreamRequestId: diagnosticId(cause?.requestId),
    method: httpMethods.has(c.req.method) ? c.req.method : "OTHER",
    route: routePath(c, -1) || "unmatched",
    status,
    category,
    reason: failureReason(error.message),
    elapsedMs: Math.round(performance.now() - context.startedAt),
    ...(await actor(c)),
    ids,
    operation: context.operation,
    locations: failureLocations(error),
  };
}
