import { logger } from "@sps/backend-utils";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import {
  repairRbacNaturalKeys,
  type NaturalKeyRepairMode,
} from "./natural-key-repair";

function getMode(): NaturalKeyRepairMode {
  if (process.argv.includes("--apply")) {
    return "apply";
  }

  return "check";
}

async function closeDatabase() {
  const client = getPostgresClient();
  await client.end();
  resetPostgresClient();
}

async function main() {
  const mode = getMode();

  try {
    const result = await repairRbacNaturalKeys({ mode });

    logger.info(
      "RBAC_NATURAL_KEY_REPAIR",
      JSON.stringify({
        mode: result.mode,
        skipped: result.skipped,
        before: result.before,
        after: result.after,
        changes: result.changes,
      }),
    );

    await closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error("RBAC_NATURAL_KEY_REPAIR_FAILED", error);

    try {
      await closeDatabase();
    } catch {}

    process.exit(1);
  }
}

void main();
