import "../../env";
import { z } from "zod";
import { defaultAppAssembly } from "@sps/shared-backend-api";
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";

const [fileId, option, ...extra] = process.argv.slice(2);
if (
  extra.length ||
  (option && option !== "--apply") ||
  (fileId === "--list" && option)
) {
  throw new Error(
    "Usage: bun src/db/order-receipts.ts --list | <file-id> [--apply]",
  );
}

const receipts = createService(defaultAppAssembly).orderWork.legacyReceipts;
if (fileId === "--list") {
  console.log(JSON.stringify(await receipts.list(), null, 2));
} else {
  const result = await receipts.migrate(
    z.uuid().parse(fileId),
    option === "--apply",
  );
  console.log(JSON.stringify(result, null, 2));
}
process.exit(0);
