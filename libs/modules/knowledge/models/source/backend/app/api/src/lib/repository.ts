import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/models/source/backend/repository/database";
import { and, asc, inArray, ne, sql } from "drizzle-orm";
import {
  EXPERT_ORDER_SPECIFICATION_LIMIT,
  EXPERT_ORDER_SPECIFICATION_MAX_BYTES,
} from "@sps/shared-utils";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: (tx: typeof this.db) => Promise<T>) {
    return this.db.transaction(operation);
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
  async freshHeaders(ids: string[]) {
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
        sql`${Table.id} = ANY(${sql.param(ids)}::uuid[]) AND ${Table.indexedContentHash} = ${Table.contentHash}`,
      );
  }

  async specificationSnapshots(sourceIds: string[]) {
    const ids = [...new Set(sourceIds)].slice(
      0,
      EXPERT_ORDER_SPECIFICATION_LIMIT,
    );
    if (!ids.length) {
      return [];
    }
    await this.trackRead({
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    return this.db
      .select({
        sourceId: Table.id,
        versionDigest: Table.contentHash,
        title: Table.title,
        content: Table.content,
      })
      .from(Table)
      .where(
        and(
          inArray(Table.id, ids),
          ne(Table.variant, "customer-memory"),
          ne(Table.contentHash, ""),
          sql`octet_length(${Table.content}) > 0`,
          sql`octet_length(${Table.content}) + octet_length(${Table.title}) <= ${EXPERT_ORDER_SPECIFICATION_MAX_BYTES}`,
        ),
      )
      .orderBy(asc(Table.id));
  }
}
