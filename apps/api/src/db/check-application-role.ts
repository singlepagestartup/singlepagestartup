import {
  assertApplicationDatabaseRole,
  getPostgresClient,
} from "@sps/shared-backend-database-config";

const client = getPostgresClient();
try {
  await assertApplicationDatabaseRole();
} finally {
  await client.end();
}
