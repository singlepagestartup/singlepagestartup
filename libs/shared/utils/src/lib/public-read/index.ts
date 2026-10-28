export function isHiddenRecord(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      "variant" in value &&
      value.variant === "hidden",
  );
}

export function shouldHideRecord(value: unknown, variant: unknown): boolean {
  return (
    (variant === "hidden" || isHiddenRecord(value)) &&
    !(typeof variant === "string" && variant.startsWith("admin"))
  );
}

/** A separate query key keeps administrative data out of public reader caches. */
export function adminReadOptions<T extends object>(
  props: T,
): T & { params: { includeHidden: string } } {
  return {
    ...props,
    params: { ...(props as { params?: object }).params, includeHidden: "1" },
  };
}

/** Public UI explicitly asks the API to filter even privileged server SDK calls. */
export function publicReadOptions<T extends object>(
  props: T,
): T & { params: { publicOnly: string } } {
  return {
    ...props,
    params: { ...(props as { params?: object }).params, publicOnly: "1" },
  };
}
