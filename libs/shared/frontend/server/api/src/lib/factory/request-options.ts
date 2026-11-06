import type { NextRequestOptions } from "@sps/shared-utils";

// Only the API process installs a reader. Next.js and other SDK consumers
// keep their normal request options and never import a Node request context.
type TraceReader = (
  host: string,
  headers: Headers,
) => Record<string, string> | undefined;
let readTrace: TraceReader | undefined;

export function setServerRequestTraceReader(reader: TraceReader) {
  readTrace = reader;
}

export function serverRequestOptions(
  host: string,
  options?: Partial<NextRequestOptions>,
) {
  if (!readTrace) {
    return options;
  }
  const headers = new Headers(options?.headers);
  const trace = readTrace(host, headers);
  if (!trace) {
    return options;
  }
  for (const [name, value] of Object.entries(trace)) {
    headers.set(name, value);
  }
  return { ...options, headers: Object.fromEntries(headers) };
}
