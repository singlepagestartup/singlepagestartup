import { ConsistencyStore } from "../consistency";
import { requestHostRevalidation } from "@sps/backend-utils";

const store = new ConsistencyStore();
try {
  if (process.argv.includes("--reset")) {
    const epoch = await store.reset((tags) =>
      requestHostRevalidation({ path: "/", type: "layout", tags }),
    );
    console.log(JSON.stringify({ reset: true, epoch }));
  } else {
    await store.assertCoverage();
    console.log(JSON.stringify(await store.diagnostics()));
  }
} finally {
  await store.sql.end();
}
