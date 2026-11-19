import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { Table } from "@sps/crm/models/task-event/backend/repository/database";
import type {
  IPageInput,
  TEvidenceKind,
} from "@sps/crm/models/funnel/sdk/model";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async page(taskId: string, { cursor, limit = 50 }: IPageInput) {
    const predicates = [eq(Table.taskId, taskId)];
    if (cursor) {
      const revision = Number(cursor);
      if (
        !/^[1-9]\d*$/.test(cursor) ||
        !Number.isSafeInteger(revision) ||
        revision > 2_147_483_647
      ) {
        throw new Error("Validation error. Invalid history cursor");
      }
      predicates.push(lt(Table.revision, revision));
    }
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(...predicates))
      .orderBy(desc(Table.revision))
      .limit(limit + 1);
    const items = rows
      .slice(0, limit)
      .map(({ operationDigest, ...event }) => event);
    const last = items.at(-1);
    let nextCursor: string | null = null;
    if (last && rows.length > limit) {
      nextCursor = String(last.revision);
    }

    return { items, nextCursor };
  }

  async qualifyingEvidence(
    taskId: string,
    fromRevision: number,
    kinds: TEvidenceKind[],
  ) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    const rows = await this.db
      .select({ id: Table.id, detail: Table.detail })
      .from(Table)
      .where(
        and(
          eq(Table.taskId, taskId),
          gte(Table.revision, fromRevision),
          eq(Table.kind, "evidence-recorded"),
          inArray(sql`${Table.detail} -> 'evidence' ->> 'kind'`, kinds),
        ),
      )
      .orderBy(desc(Table.revision))
      .limit(1);
    return rows.at(0);
  }
}
