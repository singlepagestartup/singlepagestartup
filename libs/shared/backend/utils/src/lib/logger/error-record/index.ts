import { randomUUID } from "node:crypto";
import { failureLocations } from "../../error-locations";
import { currentRequestDiagnostics } from "../../request-diagnostics";

// Repository and background callers also pass raw driver errors, free text
// and arbitrary objects. Keep their source, never serialize their arguments.
export function runtimeErrorRecord(args: unknown[]) {
  const cause = args.find((arg): arg is Error => arg instanceof Error);
  const context = currentRequestDiagnostics();
  return {
    event: "runtime.error",
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    requestId: context?.requestId,
    traceId: context?.traceId,
    locations: failureLocations(cause ?? new Error()),
  };
}
