import { ConsistencyStore } from "../consistency";
import { HOST_SERVICE_URL } from "@sps/shared-utils";

const store = new ConsistencyStore();
try {
  if (process.argv.includes("--reset")) {
    const epoch = await store.reset(async (tags) => {
      const root = new URL(
        "/api/revalidate?path=%2F&type=layout",
        HOST_SERVICE_URL,
      );
      const reset = await fetch(root, { signal: AbortSignal.timeout(3000) });
      if (!reset.ok)
        throw new Error(`Next cache reset failed (${reset.status})`);
      for (const tag of tags) {
        const url = new URL("/api/revalidate", HOST_SERVICE_URL);
        url.searchParams.set("tag", tag);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok)
          throw new Error(`Next invalidation failed (${response.status})`);
      }
    });
    console.log(JSON.stringify({ reset: true, epoch }));
  } else {
    await store.assertCoverage();
    console.log(JSON.stringify(await store.diagnostics()));
  }
} finally {
  await store.sql.end();
}
