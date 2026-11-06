import type { NextRequestOptions } from "../types";

/** A finite, identity-specific Next entry; private reads always reach the API. */
export async function consistencyRequestOptions(
  url: string,
  options: NextRequestOptions,
): Promise<NextRequestOptions> {
  const headers = new Headers(
    options.headers as ConstructorParameters<typeof Headers>[0],
  );
  headers.set("X-SPS-Consistency", "1");
  const privateRead = headers.has("Authorization") || headers.has("Cookie");
  const noStore =
    privateRead ||
    options.cache === "no-store" ||
    headers.get("Cache-Control") === "no-store" ||
    "window" in globalThis;
  if (noStore) {
    return { ...options, headers, cache: "no-store", next: { revalidate: 0 } };
  }
  const identity = JSON.stringify([
    url,
    headers.get("X-RBAC-SECRET-KEY"),
    headers.get("Accept-Language"),
    headers.get("Accept"),
  ]);
  const hash = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identity),
  );
  const tag =
    "sps:q:" +
    Array.from(new Uint8Array(hash), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join("");
  headers.set("X-SPS-Query-Tag", tag);
  return {
    ...options,
    headers,
    next: {
      ...options.next,
      revalidate: Math.min(options.next?.revalidate ?? 3600, 43200),
      tags: [...new Set([...(options.next?.tags || []), tag])],
    },
  };
}
