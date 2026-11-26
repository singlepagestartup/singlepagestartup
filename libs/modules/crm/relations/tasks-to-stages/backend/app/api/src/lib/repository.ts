import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import {
  and,
  asc,
  notExists,
  notInArray,
  ne,
  isNull,
  desc,
  eq,
  gte,
  getTableColumns,
  inArray,
  lt,
  lte,
  sql,
} from "drizzle-orm";
import { Table } from "@sps/crm/relations/tasks-to-stages/backend/repository/database";
import type {
  IPageInput,
  TEvidenceKind,
} from "@sps/crm/models/funnel/sdk/model";

import { alias } from "drizzle-orm/pg-core";
import { Table as Stage } from "@sps/crm/models/stage/backend/repository/database";
import { Table as FunnelStage } from "@sps/crm/relations/funnels-to-stages/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async funnelStages(funnelId: string, keys: string[]) {
    await trackRepositoryRead(Stage, this.db);
    await trackRepositoryRead(FunnelStage, this.db, {
      and: [{ column: "funnelId", method: "eq", value: funnelId }],
    });
    return this.db
      .select({ id: Stage.id, key: Stage.key })
      .from(Stage)
      .innerJoin(FunnelStage, eq(FunnelStage.stageId, Stage.id))
      .where(and(eq(FunnelStage.funnelId, funnelId), inArray(Stage.key, keys)));
  }

  async retainedStages(
    taskId: string,
    configuredKeys: string[],
    closed: boolean,
  ) {
    await trackRepositoryRead(Stage, this.db);
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    return this.db
      .select({ stage: Stage })
      .from(Table)
      .innerJoin(Stage, eq(Stage.id, Table.stageId))
      .where(
        and(
          eq(Table.taskId, taskId),
          ne(Table.variant, "history"),
          notInArray(Stage.key, configuredKeys),
          closed
            ? undefined
            : inArray(Table.variant, ["completed", "closed", "current"]),
        ),
      )
      .orderBy(asc(Table.createdAt), asc(Stage.key));
  }

  async stageForTask(taskId: string, key: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    await trackRepositoryRead(Stage, this.db);
    const [row] = await this.db
      .select({ stage: Stage })
      .from(Table)
      .innerJoin(Stage, eq(Stage.id, Table.stageId))
      .where(
        and(
          eq(Table.taskId, taskId),
          ne(Table.variant, "history"),
          eq(sql`${Table.detail}->>'stageId'`, key),
        ),
      );
    if (!row) {
      throw new Error("Consistency error. Stage has no state for this task");
    }
    return row.stage;
  }

  async stageStates(taskId: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    return this.db
      .select({
        key: sql<string>`${Table.detail}->>'stageId'`,
        variant: Table.variant,
      })
      .from(Table)
      .where(and(eq(Table.taskId, taskId), ne(Table.variant, "history")));
  }

  async addStageStates(rows: (typeof Table.$inferInsert)[]) {
    if (rows.length) {
      await this.db
        .insert(Table)
        .values(rows)
        .onConflictDoNothing({
          target: [Table.taskId, Table.stageId],
          where: sql`${Table.variant} <> 'history'`,
        });
    }
  }

  async setStageState(
    taskId: string,
    key: string,
    variant: Exclude<typeof Table.$inferSelect.variant, "history">,
    revision: number,
    assignmentRevision: number,
  ) {
    const [row] = await this.db
      .update(Table)
      .set({ variant, revision, assignmentRevision })
      .where(
        and(
          eq(Table.taskId, taskId),
          eq(sql`${Table.detail}->>'stageId'`, key),
          ne(Table.variant, "history"),
        ),
      )
      .returning({ id: Table.id });
    if (!row) {
      throw new Error("Consistency error. Stage has no state for this task");
    }
  }

  async setPending(id: string, pending: boolean) {
    await this.db
      .update(Table)
      .set({ pending, queuedAt: sql`coalesce(${Table.queuedAt},now())` })
      .where(
        and(eq(Table.id, id), pending ? isNull(Table.queuedAt) : undefined),
      );
  }

  async linkReplyAction(id: string, actionId: string) {
    const [linked] = await this.db
      .update(Table)
      .set({
        detail: sql`jsonb_set(${Table.detail}, '{replyActionId}', to_jsonb(${actionId}::text))`,
      })
      .where(
        and(
          eq(Table.id, id),
          eq(Table.pending, true),
          sql`${Table.detail}->>'replyActionId' is null`,
        ),
      )
      .returning({ id: Table.id });
    return Boolean(linked);
  }

  async finishPending(
    id: string,
    onFinish: (actionId?: string) => Promise<void>,
  ) {
    return withConsistencyTransaction(this.db, async () => {
      const [event] = await this.db
        .update(Table)
        .set({ pending: false })
        .where(and(eq(Table.id, id), eq(Table.pending, true)))
        .returning({ detail: Table.detail });
      if (event) {
        await onFinish(event.detail.replyActionId);
      }
    });
  }

  async retryPreparation(id: string, failures: number, delayMs: number) {
    // Multiple workers can observe the same failure. Only one schedules the next try.
    const [event] = await this.db
      .update(Table)
      .set({
        detail: sql`jsonb_set(${Table.detail}, '{preparationFailures}', to_jsonb(${failures + 1}::integer))`,
        queuedAt: sql`clock_timestamp() + ${delayMs} * interval '1 millisecond'`,
      })
      .where(
        and(
          eq(Table.id, id),
          eq(Table.pending, true),
          eq(
            sql`coalesce((${Table.detail}->>'preparationFailures')::integer, 0)`,
            failures,
          ),
        ),
      )
      .returning({ id: Table.id });
    return Boolean(event);
  }

  async defer(id: string) {
    await this.db
      .update(Table)
      .set({ queuedAt: new Date() })
      .where(and(eq(Table.id, id), eq(Table.pending, true)));
  }

  async pendingEvents(limit: number, taskId?: string) {
    const earlier = alias(Table, "earlier_pending_stage");
    const earlierPending = this.db
      .select({ id: earlier.id })
      .from(earlier)
      .where(
        and(
          eq(earlier.pending, true),
          eq(earlier.taskId, Table.taskId),
          eq(earlier.assignmentRevision, Table.assignmentRevision),
          lt(earlier.revision, Table.revision),
        ),
      );
    return this.db
      .select(getTableColumns(Table))
      .from(Table)
      .innerJoin(Task, eq(Task.id, Table.taskId))
      .where(
        and(
          eq(Table.pending, true),
          notExists(earlierPending),
          sql`(${Table.detail}->>'preparationFailures' is null or ${Table.queuedAt} <= clock_timestamp())`,
          taskId
            ? and(
                eq(Task.id, taskId),
                eq(Task.assignmentRevision, Table.assignmentRevision),
              )
            : undefined,
        ),
      )
      .orderBy(asc(Table.queuedAt), asc(Table.id))
      .limit(limit);
  }

  async forMessages(taskId: string | undefined, messageIds: string[]) {
    if (!messageIds.length) {
      return [];
    }
    await trackRepositoryRead(Table, this.db);
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          taskId ? eq(Table.taskId, taskId) : undefined,
          inArray(sql`${Table.detail}->>'messageId'`, messageIds),
          inArray(Table.kind, [
            "customer-message",
            "staff-message",
            "customer-work-resumed",
          ]),
        ),
      )
      .orderBy(desc(Table.revision), desc(Table.id));
  }

  async page(taskId: string, { cursor, limit = 50 }: IPageInput) {
    const predicates = [eq(Table.taskId, taskId), eq(Table.variant, "history")];
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

  async visitedStageIds(taskId: string, revision: number) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "taskId", method: "eq", value: taskId }],
    });
    const visits = await this.db
      .selectDistinct({
        previousStageId: sql<
          string | null
        >`${Table.detail} ->> 'previousStageId'`,
        stageId: sql<string | null>`${Table.detail} ->> 'stageId'`,
      })
      .from(Table)
      .where(
        and(
          eq(Table.taskId, taskId),
          lte(Table.revision, revision),
          inArray(Table.kind, ["opened", "transitioned", "migrated"]),
        ),
      );
    const ids = new Set<string>();
    for (const { previousStageId, stageId } of visits) {
      if (previousStageId) {
        ids.add(previousStageId);
      }
      if (stageId) {
        ids.add(stageId);
      }
    }
    return [...ids];
  }
}
