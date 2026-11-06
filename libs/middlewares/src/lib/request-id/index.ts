import { createMiddleware } from "hono/factory";
import { MiddlewareHandler } from "hono";
import {
  currentRequestDiagnostics,
  rbacSecretMatches,
  requestDiagnostics,
  runWithRequestDiagnostics,
} from "@sps/backend-utils";
import { API_SERVICE_URL } from "@sps/shared-utils";
import { setServerRequestTraceReader } from "@sps/shared-frontend-server-api";

export type IMiddlewareGeneric = unknown;

export class Middleware {
  init(): MiddlewareHandler<any, any, {}> {
    setServerRequestTraceReader((host, headers) => {
      const context = currentRequestDiagnostics();
      if (
        !context ||
        host !== API_SERVICE_URL ||
        !rbacSecretMatches(headers.get("X-RBAC-SECRET-KEY"))
      ) {
        return;
      }
      return {
        "X-SPS-Trace-Id": context.traceId,
        "X-SPS-Parent-Request-Id": context.requestId,
      };
    });
    return createMiddleware(async (c, next) => {
      const { requestId } = requestDiagnostics(c);
      c.req.raw.headers.set("x-request-id", requestId);
      await runWithRequestDiagnostics(c, next);
    });
  }
}
