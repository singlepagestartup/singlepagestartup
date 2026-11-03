import {
  CONSISTENCY_REVALIDATION_BATCH_SIZE,
  HOST_SERVICE_REVALIDATION_SECRET,
  HOST_SERVICE_REVALIDATION_SECRET_HEADER,
  HOST_SERVICE_URL,
} from "@sps/shared-utils";

export interface IHostRevalidationRequest {
  tags?: string[];
  path?: string;
  type?: "page" | "layout";
}

export async function requestHostRevalidation({
  tags = [],
  path,
  type,
}: IHostRevalidationRequest): Promise<void> {
  const unique = [...new Set(tags)];
  if (!unique.length && path === undefined) return;
  if (!HOST_SERVICE_REVALIDATION_SECRET) {
    throw new Error("HOST_SERVICE_REVALIDATION_SECRET is not configured");
  }

  const endpoint = new URL("/api/revalidate", HOST_SERVICE_URL);
  const batchSize = CONSISTENCY_REVALIDATION_BATCH_SIZE;
  const batches = Math.max(1, Math.ceil(unique.length / batchSize));
  for (let index = 0; index < batches; index++) {
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        [HOST_SERVICE_REVALIDATION_SECRET_HEADER]:
          HOST_SERVICE_REVALIDATION_SECRET,
      },
      body: JSON.stringify({
        tags: unique.slice(index * batchSize, (index + 1) * batchSize),
        ...(index === 0 && path !== undefined ? { path, type } : {}),
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`Next invalidation failed (${response.status})`);
    }
  }
}
