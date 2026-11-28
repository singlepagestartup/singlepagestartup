import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { Table as TaskStage } from "@sps/crm/relations/tasks-to-stages/backend/repository/database";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  lt,
  ne,
  notLike,
  or,
  sql,
} from "drizzle-orm";
import { Table } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as Stage } from "@sps/crm/models/stage/backend/repository/database";
import { Table as FunnelStage } from "@sps/crm/relations/funnels-to-stages/backend/repository/database";
import { Table as FunnelTask } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";
import { Table as FunnelOffer } from "@sps/crm/relations/funnels-to-ecommerce-module-stores-to-products/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { v5 as stageUuid } from "uuid";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { STORE_EMPLOYEE_TRAINING_KEY_PREFIX } from "@sps/crm/models/task/sdk/model";
import type {
  IFunnelDefinition,
  IModel as IFunnel,
  IFunnelStage,
  IListFunnels,
  TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import {
  linearFunnelDefinition,
  normalizeStageBehavior,
  readPageCursor,
} from "@sps/crm/models/funnel/sdk/model";

type TFunnelRow = typeof Table.$inferSelect;

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async funnelIds(stageId: string) {
    await trackRepositoryRead(FunnelStage, this.db, {
      and: [{ column: "stageId", method: "eq", value: stageId }],
    });
    const rows = await this.db
      .select({ id: FunnelStage.funnelId })
      .from(FunnelStage)
      .where(eq(FunnelStage.stageId, stageId));
    return rows.map((row) => row.id);
  }

  transaction<T>(operation: () => Promise<T>) {
    return withConsistencyTransaction(this.db, operation);
  }

  async lockCreation(id: string) {
    const key = `crm:funnel:create:${id}`;
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
    );
  }

  async lock(storeId: string, id: string, mode: "share" | "update") {
    const [row] = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(and(eq(Table.storeId, storeId), eq(Table.id, id)))
      .for(mode);
    return row;
  }

  async configurations(rows: TFunnelRow[]): Promise<IFunnel[]> {
    if (!rows.length) {
      return [];
    }
    const ids = rows.map(({ id }) => id);
    await Promise.all(
      [FunnelStage, FunnelOffer].map((table) =>
        trackRepositoryRead(table, this.db, {
          and: [{ column: "funnelId", method: "inArray", value: ids }],
        }),
      ),
    );
    await Promise.all([
      trackRepositoryRead(Stage, this.db),
      trackRepositoryRead(Offer, this.db),
    ]);
    const orderedStages = this.db
      .select({
        value: sql`coalesce(jsonb_agg(${Stage.configuration} || jsonb_build_object('id',${Stage.key},'name',${Stage.name}) order by ${FunnelStage.position}, ${FunnelStage.id}),'[]'::jsonb)`,
      })
      .from(FunnelStage)
      .innerJoin(Stage, eq(Stage.id, FunnelStage.stageId))
      .where(eq(FunnelStage.funnelId, Table.id));
    const linkedOffers = this.db
      .select({
        value: sql`coalesce(jsonb_agg(jsonb_build_object('offerId',${Offer.id},'productId',${Offer.productId}) order by ${Offer.id}),'[]'::jsonb)`,
      })
      .from(FunnelOffer)
      .innerJoin(Offer, eq(Offer.id, FunnelOffer.offerId))
      .where(eq(FunnelOffer.funnelId, Table.id));
    const records = await this.db
      .select({
        row: Table,
        stages: sql<IFunnelStage[]>`${orderedStages}`,
        offers: sql<{ offerId: string; productId: string }[]>`${linkedOffers}`,
      })
      .from(Table)
      .where(inArray(Table.id, ids));
    const byId = new Map(records.map((record) => [record.row.id, record]));
    return ids.flatMap((id) => {
      const record = byId.get(id);
      if (!record) {
        return [];
      }
      const { row, stages, offers } = record;
      const definition = {
        ...row.definition,
        stages: stages.map((stage) =>
          stage.behavior
            ? { ...stage, behavior: normalizeStageBehavior(stage.behavior) }
            : stage,
        ),
      };
      return [
        {
          ...row,
          // Linear actions and the entry point follow the current relation positions,
          // including changes made through the relation SDK outside the editor.
          definition:
            definition.progression === "linear"
              ? linearFunnelDefinition(definition)
              : definition,
          bindings: {
            ...row.bindings,
            productIds: [
              ...new Set(offers.map((offer) => offer.productId)),
            ].sort(),
            offerIds: offers.map((offer) => offer.offerId),
          },
        },
      ];
    });
  }

  private async one(storeId: string, predicate: ReturnType<typeof eq>) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(eq(Table.storeId, storeId), predicate))
      .limit(1);
    const [funnel] = await this.configurations(rows);
    return funnel;
  }

  scoped(storeId: string, id: string) {
    return this.one(storeId, eq(Table.id, id));
  }

  scopedBySlug(storeId: string, slug: string) {
    return this.one(storeId, eq(Table.slug, slug));
  }

  async lockById(id: string) {
    const [row] = await this.db
      .select({ storeId: Table.storeId })
      .from(Table)
      .where(eq(Table.id, id))
      .for("update");
    return row;
  }

  async bumpRevision(id: string, updatedAt: Date) {
    await this.db
      .update(Table)
      .set({ revision: sql`${Table.revision} + 1`, updatedAt })
      .where(eq(Table.id, id));
  }

  async storeTaskCount(storeId: string) {
    await Promise.all([
      trackRepositoryRead(Table, this.db, {
        and: [{ column: "storeId", method: "eq", value: storeId }],
      }),
      trackRepositoryRead(FunnelTask, this.db),
      trackRepositoryRead(Task, this.db),
    ]);
    const [row] = await this.db
      .select({ count: countDistinct(Task.id) })
      .from(Table)
      .innerJoin(FunnelTask, eq(FunnelTask.funnelId, Table.id))
      .innerJoin(Task, eq(Task.id, FunnelTask.taskId))
      .where(
        and(
          eq(Table.storeId, storeId),
          eq(FunnelTask.variant, "primary"),
          notLike(Task.openingKey, `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}%`),
        ),
      );
    return row.count;
  }

  async taskScopes(criteria: {
    primaryOnly?: boolean;
    taskIds?: string[];
    storeId?: string;
    funnelId?: string;
  }) {
    await Promise.all([
      trackRepositoryRead(FunnelTask, this.db),
      trackRepositoryRead(Table, this.db),
    ]);
    return this.db
      .select({
        taskId: FunnelTask.taskId,
        funnelId: Table.id,
        storeId: Table.storeId,
      })
      .from(FunnelTask)
      .innerJoin(Table, eq(Table.id, FunnelTask.funnelId))
      .where(
        and(
          criteria.primaryOnly ? eq(FunnelTask.variant, "primary") : undefined,
          criteria.taskIds
            ? inArray(FunnelTask.taskId, criteria.taskIds)
            : undefined,
          criteria.storeId ? eq(Table.storeId, criteria.storeId) : undefined,
          criteria.funnelId ? eq(Table.id, criteria.funnelId) : undefined,
        ),
      );
  }

  async rebindOpenStageStates(funnelId: string, taskId?: string) {
    const linked = this.db
      .select({
        taskId: FunnelTask.taskId,
        stageId: FunnelStage.stageId,
        key: Stage.key,
      })
      .from(FunnelTask)
      .innerJoin(Task, eq(Task.id, FunnelTask.taskId))
      .innerJoin(FunnelStage, eq(FunnelStage.funnelId, FunnelTask.funnelId))
      .innerJoin(Stage, eq(Stage.id, FunnelStage.stageId))
      .where(
        and(
          eq(FunnelTask.funnelId, funnelId),
          eq(FunnelTask.variant, "primary"),
          taskId ? eq(FunnelTask.taskId, taskId) : undefined,
          ne(Task.status, "closed"),
        ),
      )
      .as("linked");
    await this.db
      .update(TaskStage)
      .set({ stageId: linked.stageId })
      .from(linked)
      .where(
        and(
          ne(TaskStage.variant, "history"),
          eq(TaskStage.taskId, linked.taskId),
          ne(TaskStage.stageId, linked.stageId),
          eq(sql`${TaskStage.detail}->>'stageId'`, linked.key),
        ),
      );
  }

  async replacePrimaryFunnel(taskId: string, fromId: string, toId: string) {
    const [link] = await this.db
      .update(FunnelTask)
      .set({ funnelId: toId })
      .where(
        and(
          eq(FunnelTask.taskId, taskId),
          eq(FunnelTask.funnelId, fromId),
          eq(FunnelTask.variant, "primary"),
        ),
      )
      .returning({ id: FunnelTask.id });
    if (!link) {
      throw new Error("Conflict error. The executing funnel has changed");
    }
  }

  async replaceStageLinks(funnelId: string, definition: IFunnelDefinition) {
    const linked = await this.db
      .select({
        linkId: FunnelStage.id,
        position: FunnelStage.position,
        key: Stage.key,
        id: Stage.id,
        name: Stage.name,
        configuration: Stage.configuration,
      })
      .from(FunnelStage)
      .innerJoin(Stage, eq(Stage.id, FunnelStage.stageId))
      .where(eq(FunnelStage.funnelId, funnelId));
    const existingByKey = new Map(linked.map((stage) => [stage.key, stage]));
    const retainedKeys = new Set(definition.stages.map((stage) => stage.id));
    const removedLinks = linked
      .filter((link) => !retainedKeys.has(link.key))
      .map((link) => link.linkId);
    if (removedLinks.length) {
      await this.db
        .delete(FunnelStage)
        .where(inArray(FunnelStage.id, removedLinks));
    }
    const stageRows = definition.stages.map(
      ({ id: key, name, ...configuration }) => ({
        id: existingByKey.get(key)?.id ?? stageUuid(key, funnelId),
        key,
        name,
        configuration,
      }),
    );
    const elsewhere = await this.db
      .select({ id: FunnelStage.stageId })
      .from(FunnelStage)
      .where(
        and(
          ne(FunnelStage.funnelId, funnelId),
          inArray(
            FunnelStage.stageId,
            stageRows.map((stage) => stage.id),
          ),
        ),
      );
    const shared = new Set(elsewhere.map(({ id }) => id));
    for (const stage of stageRows) {
      const previous = existingByKey.get(stage.key);
      if (
        previous?.name === stage.name &&
        isDeepStrictEqual(previous.configuration, stage.configuration)
      ) {
        continue;
      }
      // A store editor owns its funnel. Direct edits to the shared stage use the stage service.
      if (shared.has(stage.id)) {
        stage.id = randomUUID();
      }
      await this.db
        .insert(Stage)
        .values(stage)
        .onConflictDoUpdate({
          target: Stage.id,
          set: { name: stage.name, configuration: stage.configuration },
        });
    }
    const newLinks: (typeof FunnelStage.$inferInsert)[] = [];
    for (const [position, stage] of stageRows.entries()) {
      const link = existingByKey.get(stage.key);
      if (!link) {
        newLinks.push({ funnelId, stageId: stage.id, position });
      } else if (link.position !== position || link.id !== stage.id) {
        await this.db
          .update(FunnelStage)
          .set({ stageId: stage.id, position })
          .where(eq(FunnelStage.id, link.linkId));
      }
    }
    if (newLinks.length) {
      await this.db.insert(FunnelStage).values(newLinks);
    }
  }

  async replaceOfferLinks(funnelId: string, offerIds: string[]) {
    const links = await this.db
      .select({ id: FunnelOffer.id, offerId: FunnelOffer.offerId })
      .from(FunnelOffer)
      .where(eq(FunnelOffer.funnelId, funnelId));
    const retained = new Set(offerIds);
    const existing = new Set(links.map((link) => link.offerId));
    const removed = links
      .filter((link) => !retained.has(link.offerId))
      .map((link) => link.id);
    const added = offerIds.filter((id) => !existing.has(id));
    if (removed.length) {
      await this.db.delete(FunnelOffer).where(inArray(FunnelOffer.id, removed));
    }
    if (added.length) {
      await this.db
        .insert(FunnelOffer)
        .values(added.map((offerId) => ({ funnelId, offerId })));
    }
  }

  async list(input: IListFunnels) {
    const limit = input.limit ?? 50;
    const predicates = [eq(Table.storeId, input.storeId)];
    if (input.kind) {
      predicates.push(eq(Table.kind, input.kind));
    }

    if (input.search) {
      predicates.push(
        sql`(strpos(lower(${Table.name}), lower(${input.search})) > 0 or strpos(lower(${Table.slug}), lower(${input.search})) > 0)`,
      );
    }

    const matches = and(...predicates);
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
    const [rows, [summary]] = await Promise.all([
      this.db
        .select()
        .from(Table)
        .where(and(...predicates))
        .orderBy(desc(Table.updatedAt), desc(Table.id))
        .limit(limit + 1)
        .offset(input.offset ?? 0),
      this.db.select({ total: count() }).from(Table).where(matches),
    ]);
    const items = await this.configurations(rows);
    return { items, total: summary.total };
  }

  async candidates(storeId: string, kind: TFunnelKind) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(eq(Table.storeId, storeId), eq(Table.kind, kind)));
    return this.configurations(rows);
  }

  async linkedToProduct(input: {
    storeId: string;
    productId: string;
    offerIds: string[];
  }) {
    await Promise.all(
      [Table, FunnelOffer, Offer].map((table) =>
        trackRepositoryRead(table, this.db),
      ),
    );
    return this.db
      .selectDistinct({
        id: Table.id,
        slug: Table.slug,
        title: Table.name,
        updatedAt: Table.updatedAt,
      })
      .from(Table)
      .innerJoin(FunnelOffer, eq(FunnelOffer.funnelId, Table.id))
      .innerJoin(Offer, eq(FunnelOffer.offerId, Offer.id))
      .where(
        and(
          eq(Table.storeId, input.storeId),
          eq(Offer.productId, input.productId),
        ),
      )
      .orderBy(desc(Table.updatedAt), desc(Table.id));
  }

  async trainingBudget(storeId: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(eq(Table.storeId, storeId))
      .orderBy(desc(Table.updatedAt), desc(Table.id));
    return this.configurations(rows);
  }

  async candidatesForForm(formId: string) {
    await trackRepositoryRead(Table, this.db);
    const rows = await this.db
      .select()
      .from(Table)
      .where(
        and(
          eq(Table.kind, "consultation"),
          sql`jsonb_exists(${Table.bindings}->'formIds', ${formId})`,
        ),
      );
    return this.configurations(rows);
  }

  async occupiedStages(funnelId: string) {
    await trackRepositoryRead(Task, this.db);
    await trackRepositoryRead(FunnelTask, this.db, {
      and: [{ column: "funnelId", method: "eq", value: funnelId }],
    });
    return this.db
      .selectDistinct({ stageId: Task.stageId })
      .from(Task)
      .innerJoin(FunnelTask, eq(FunnelTask.taskId, Task.id))
      .where(this.openStandardTasks(funnelId));
  }

  async stagesForTaskReconciliation(funnelId: string, stageIds: string[]) {
    await trackRepositoryRead(Task, this.db);
    return this.db
      .select({ task: Task })
      .from(Task)
      .innerJoin(FunnelTask, eq(FunnelTask.taskId, Task.id))
      .where(
        and(this.openStandardTasks(funnelId), inArray(Task.stageId, stageIds)),
      )
      .orderBy(asc(Task.id))
      .for("update", { of: Task });
  }

  async reviseTask(id: string, data: Partial<typeof Task.$inferInsert>) {
    await this.db.update(Task).set(data).where(eq(Task.id, id));
  }

  private openStandardTasks(funnelId: string) {
    return and(
      eq(FunnelTask.funnelId, funnelId),
      eq(FunnelTask.variant, "primary"),
      ne(Task.status, "closed"),
      notLike(Task.openingKey, `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}%`),
    );
  }

  async createFunnel(data: typeof Table.$inferInsert & { slug: string }) {
    let position = 1;
    let row: typeof Table.$inferSelect | undefined;
    do {
      const slug = position === 1 ? data.slug : `${data.slug}-${position}`;
      [row] = await this.db
        .insert(Table)
        .values({ ...data, slug })
        .onConflictDoNothing({ target: [Table.storeId, Table.slug] })
        .returning();
      position += 1;
    } while (!row);
    return row;
  }

  async replaceConfiguration(
    id: string,
    data: Partial<typeof Table.$inferInsert>,
  ) {
    const [row] = await this.db
      .update(Table)
      .set(data)
      .where(eq(Table.id, id))
      .returning();
    return row;
  }
}
