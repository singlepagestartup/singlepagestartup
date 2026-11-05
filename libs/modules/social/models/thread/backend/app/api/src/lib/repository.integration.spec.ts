import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Table } from "@sps/social/models/thread/backend/repository/database";
import { Configuration } from "./configuration";
import { Repository } from "./repository";

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

it("atomically merges independent namespaces and rejects concurrent stale writes", async () => {
  const db = getDrizzle({ Table });
  const repo = new Repository(new Configuration());
  const [thread] = await db
    .insert(Table)
    .values({
      slug: `context-cas-${randomUUID()}`,
      metadata: { keep: "exact" },
    })
    .returning();
  try {
    const results = await Promise.all([
      repo.updateMetadataNamespace({
        id: thread.id,
        namespace: "memory",
        expectedValue: null,
        value: { revision: 1 },
      }),
      repo.updateMetadataNamespace({
        id: thread.id,
        namespace: "preferences",
        expectedValue: null,
        value: { modelId: "test" },
      }),
      repo.updateMetadataNamespace({
        id: thread.id,
        namespace: "proposal",
        expectedValue: null,
        value: { text: "Exact proposed text", status: "pending" },
      }),
    ]);
    expect(results.every(Boolean)).toBe(true);
    const [fresh] = await db
      .select()
      .from(Table)
      .where(eq(Table.id, thread.id));
    expect(fresh.metadata).toMatchObject({
      keep: "exact",
      memory: { revision: 1 },
      preferences: { modelId: "test" },
      proposal: { text: "Exact proposed text" },
    });
    const sameNamespace = await Promise.all(
      [2, 3].map((revision) =>
        repo.updateMetadataNamespace({
          id: thread.id,
          namespace: "memory",
          expectedValue: { revision: 1 },
          value: { revision },
        }),
      ),
    );
    expect(sameNamespace.filter(Boolean)).toHaveLength(1);
    const [final] = await db
      .select()
      .from(Table)
      .where(eq(Table.id, thread.id));
    expect(final.metadata.keep).toBe("exact");
    expect(final.metadata.proposal).toEqual(fresh.metadata.proposal);
    await expect(
      repo.updateMetadataNamespace({
        id: thread.id,
        namespace: "__proto__",
        expectedValue: null,
        value: {},
      }),
    ).rejects.toThrow("Invalid");
  } finally {
    await db.delete(Table).where(eq(Table.id, thread.id));
  }
});
