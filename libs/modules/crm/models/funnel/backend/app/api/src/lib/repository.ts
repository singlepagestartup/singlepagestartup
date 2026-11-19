import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { Table } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as Publication } from "@sps/crm/models/funnel-publication/backend/repository/database";
import type {
  IListFunnels,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import { readPageCursor, updatedPage } from "@sps/crm/models/funnel/sdk/model";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: () => Promise<T>) {
    return this.db.transaction((tx) => withConsistencyDatabase(tx, operation));
  }

  async scoped(storeId: string, id: string, lock = false) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    const query = this.db
      .select()
      .from(Table)
      .where(and(eq(Table.storeId, storeId), eq(Table.id, id)));
    if (lock) {
      const [row] = await query.for("update");
      return row;
    }

    const [row] = await query;
    return row;
  }

  async list(input: IListFunnels) {
    const limit = input.limit ?? 50;
    const predicates = [eq(Table.storeId, input.storeId)];
    if (input.kind) {
      predicates.push(eq(Table.kind, input.kind));
    }

    if (input.cursor) {
      const position = readPageCursor(input.cursor);
      predicates.push(
        or(
          lt(Table.updatedAt, position.updatedAt),
          and(
            eq(Table.updatedAt, position.updatedAt),
            lt(Table.id, position.id),
          ),
        )!,
      );
    }

    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: input.storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(...predicates))
      .orderBy(desc(Table.updatedAt), desc(Table.id))
      .limit(limit + 1);
    return updatedPage(rows, limit);
  }

  async published(storeId: string, kind: TFunnelKind) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    await trackRepositoryRead(Publication, this.db);
    return this.db
      .select({ publication: Publication })
      .from(Table)
      .innerJoin(
        Publication,
        and(
          eq(Table.id, Publication.funnelId),
          eq(Table.publishedVersion, Publication.version),
        ),
      )
      .where(and(eq(Table.storeId, storeId), eq(Table.kind, kind)));
  }

  async publishedForForm(formId: string) {
    await trackRepositoryRead(Table, this.db);
    await trackRepositoryRead(Publication, this.db);
    return this.db
      .select({ publication: Publication, storeId: Table.storeId })
      .from(Table)
      .innerJoin(
        Publication,
        and(
          eq(Table.id, Publication.funnelId),
          eq(Table.publishedVersion, Publication.version),
        ),
      )
      .where(
        and(
          eq(Table.kind, "consultation"),
          sql`jsonb_exists(${Publication.bindings}->'formIds', ${formId})`,
        ),
      )
      .limit(2);
  }

  async createDraft(data: typeof Table.$inferInsert) {
    const [row] = await this.db.insert(Table).values(data).returning();
    return row;
  }

  async replaceDraft(id: string, data: Partial<typeof Table.$inferInsert>) {
    const [row] = await this.db
      .update(Table)
      .set(data)
      .where(eq(Table.id, id))
      .returning();
    return row;
  }
}
