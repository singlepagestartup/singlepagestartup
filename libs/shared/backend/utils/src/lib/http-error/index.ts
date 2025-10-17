import { httpErrorPatterns } from "./paterns";

export function util(error: any): {
  status: number;
  message: string;
  details?: string;
} {
  const baseMessage = String(error?.message ?? error);
  const causeMessage =
    typeof error?.cause?.message === "string" ? error.cause.message : undefined;

  const message = baseMessage || causeMessage || "Unknown error";

  for (const [status, patterns] of httpErrorPatterns) {
    if (
      patterns.some((p) =>
        typeof p === "string" ? message.includes(p) : p.test(message),
      )
    ) {
      return { status, message, details: causeMessage };
    }
  }

  return {
    status: 500,
    message: `Internal server error: ${message}`,
    details: causeMessage,
  };
}
