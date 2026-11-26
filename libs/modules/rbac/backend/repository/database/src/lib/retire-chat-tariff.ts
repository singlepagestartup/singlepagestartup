import { and, eq } from "drizzle-orm";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { Table as Permission } from "@sps/rbac/models/permission/backend/repository/database";

// Match the installed permission by natural key because seeds assign local IDs.
// Foreign keys cascade to its retired tariff and role links.
const retiredPath =
  "/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/messages/[social.messages.id]/react-by/openrouter";

async function main() {
  try {
    await getDrizzle({})
      .delete(Permission)
      .where(
        and(
          eq(Permission.type, "HTTP"),
          eq(Permission.method, "POST"),
          eq(Permission.path, retiredPath),
        ),
      );
  } finally {
    await getPostgresClient().end();
  }
}

void main().catch(() => {
  console.error("Could not retire the former chat tariff.");
  process.exitCode = 1;
});
