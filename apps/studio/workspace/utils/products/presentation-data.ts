import { parse } from "yaml";

/** Reads only the presentation's own source, never another document or product. */
export function parseProductPresentation<T>(
  source: string,
  expectedProductId: string,
): T {
  const value = parse(source) as Record<string, unknown> | null;
  if (value?.schema !== "singlepagestartup.product-presentation.v1") {
    throw new Error("Presentation uses an unsupported schema");
  }
  if (value.product_id !== expectedProductId) {
    throw new Error(`Presentation must belong to product ${expectedProductId}`);
  }
  if (
    !value.content ||
    typeof value.content !== "object" ||
    Array.isArray(value.content)
  ) {
    throw new Error(`${expectedProductId} presentation needs its own content`);
  }
  return value.content as T;
}
