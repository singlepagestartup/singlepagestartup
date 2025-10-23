export function extractMessage(error: any): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.cause) return extractMessage(error.cause);
  return String(error);
}

export function extractOriginalError(error: any): any {
  if (error?.cause) return extractOriginalError(error.cause);
  return error;
}
