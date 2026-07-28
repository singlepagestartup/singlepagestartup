import { IContentToolEnvelope } from "./types";

export function toMcpText(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        // MCP responses are consumed by machines. Pretty-printing the complete
        // module catalog adds enough whitespace that a valid response can cross
        // the bounded AI tool-result limit before the model sees it.
        text: JSON.stringify(payload),
      },
    ],
  };
}

export function okEnvelope(
  type: string,
  data: unknown,
  meta?: Record<string, unknown>,
): IContentToolEnvelope {
  return {
    ok: true,
    type,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function errorEnvelope(
  kind: string,
  message: string,
  details?: unknown,
): IContentToolEnvelope {
  return {
    ok: false,
    error: {
      kind,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export function okResponse(
  type: string,
  data: unknown,
  meta?: Record<string, unknown>,
) {
  return toMcpText(okEnvelope(type, data, meta));
}

export function errorResponse(
  kind: string,
  message: string,
  details?: unknown,
) {
  return toMcpText(errorEnvelope(kind, message, details));
}

export function unknownErrorResponse(error: unknown) {
  if (error instanceof Error) {
    return errorResponse("error", error.message);
  }

  return errorResponse("error", String(error));
}
