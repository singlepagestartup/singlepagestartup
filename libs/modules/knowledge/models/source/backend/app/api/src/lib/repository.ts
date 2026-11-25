import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  withConsistencyTransaction,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/source/backend/repository/database";
import { and, asc, inArray, ne, sql } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: (tx: typeof this.db) => Promise<T>) {
    return withConsistencyTransaction(this.db, () => operation(this.db));
  }
  readSnapshot<T>(operation: (tx: typeof this.db) => Promise<T>) {
    return this.db.transaction(operation, {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });
  }

  async lock(ids: string[]) {
    if (!ids.length) return [];
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    return this.db
      .select()
      .from(Table)
      .where(inArray(Table.id, [...new Set(ids)]))
      .orderBy(asc(Table.id))
      .for("update");
  }

  async lockSlug(slug: string) {
    await this.db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${slug}))`);
  }
  async freshHeaders(ids: string[], includeCustomerMemory = false) {
    if (!ids.length) return [];
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    return this.db
      .select({
        id: Table.id,
        title: Table.title,
        contentHash: Table.contentHash,
        indexedContentHash: Table.indexedContentHash,
      })
      .from(Table)
      .where(
        and(
          sql`${Table.id} = ANY(${sql.param(ids)}::uuid[]) AND ${Table.indexedContentHash} = ${Table.contentHash}`,
          includeCustomerMemory
            ? undefined
            : ne(Table.variant, "customer-memory"),
        ),
      );
  }

  async privateSourceIds() {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "variant", method: "eq", value: "customer-memory" }],
    });
    const rows = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(sql`${Table.variant} = ${"customer-memory"}`);
    return rows.map(({ id }) => id);
  }
}
