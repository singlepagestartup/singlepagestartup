import { ConsistencyStore } from "@sps/providers-db";
const store = new ConsistencyStore();
try {
  const covered = await store.assertCoverage();
  const status = await store.status();
  console.log(
    JSON.stringify({
      resources: covered,
      covered,
      ...status,
    }),
  );
} finally {
  await store.sql.end();
}
