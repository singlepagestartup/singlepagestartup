import { v5 as stageUuid } from "uuid";
import type { TransactionSql } from "postgres";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import {
  funnelDefinitionSchema,
  type IFunnelBindings,
  type IFunnelDefinition,
  type IFunnelStage,
  type TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import {
  restoreOccupiedStages,
  validateFunnelDefinition,
} from "@sps/crm/models/funnel/backend/app/api/src/lib/service/singlepage/utils";
import type { ITaskEventDetail } from "@sps/crm/relations/tasks-to-stages/sdk/model";

interface IFunnelRow {
  id: string;
  store_id: string;
  name: string;
  kind: TFunnelKind;
  configured_at: Date | null;
  published_version: number | null;
  definition: IFunnelDefinition;
  bindings: IFunnelBindings;
}

interface IPublication {
  id: string;
  version: number;
  name: string;
  definition: IFunnelDefinition;
  bindings: IFunnelBindings;
}

async function writeStage(
  tx: TransactionSql,
  funnelId: string,
  stage: IFunnelStage,
) {
  const { id: key, name, ...configuration } = stage;
  const id = stageUuid(key, funnelId);
  await tx`insert into sps_cm_stage(id,key,name,configuration) values(${id},${key},${name},${tx.json(JSON.parse(JSON.stringify(configuration)))}) on conflict(id) do update set name=excluded.name,configuration=excluded.configuration`;
  return id;
}

async function migrateFunnel(
  tx: TransactionSql,
  row: IFunnelRow,
  publications: IPublication[],
) {
  const [present] =
    await tx`select 1 from sps_cm_funnels_to_stages where funnel_id=${row.id} limit 1`;
  if (present || !Array.isArray(row.definition.stages)) {
    return;
  }
  let definition = row.definition;
  let bindings = row.bindings;
  let name = row.name;
  let priorEdit;
  if (!row.configured_at && row.published_version !== null) {
    const active = publications.find(
      (p) => p.version === row.published_version,
    );
    try {
      validateFunnelDefinition(
        funnelDefinitionSchema.parse(definition),
        row.kind,
      );
    } catch (error) {
      if (!active) {
        throw new Error(
          `Funnel ${row.id} has an invalid draft and no runnable publication`,
          { cause: error },
        );
      }
      priorEdit = { definition, bindings, name };
      ({ definition, bindings, name } = active);
    }
  }
  const tasks = await tx<
    { stage_id: string; publication_id: string; status: string }[]
  >`select stage_id,publication_id,status from sps_cm_task where funnel_id=${row.id} order by updated_at desc,id`;
  const byId = new Map(publications.map((p) => [p.id, p]));
  definition = restoreOccupiedStages(
    definition,
    tasks.flatMap((t) => {
      const publication = byId.get(t.publication_id);
      return t.status !== "closed" && publication
        ? [{ stageId: t.stage_id, definition: publication.definition }]
        : [];
    }),
  );
  for (const p of publications) {
    for (const stage of p.definition.stages) {
      await writeStage(tx, row.id, stage);
    }
  }
  for (const [position, stage] of definition.stages.entries()) {
    const id = await writeStage(tx, row.id, stage);
    await tx`insert into sps_cm_funnels_to_stages(funnel_id,stage_id,position) values(${row.id},${id},${position})`;
  }

  const ids = new Set(bindings.offerIds);
  for (const productId of bindings.productIds) {
    const offers =
      await tx`select id from sps_ee_ss_to_ps_vn7 where se_id=${row.store_id} and pt_id=${productId}`;
    if (!offers.length) {
      throw new Error(
        `Funnel ${row.id} refers to product ${productId} without an offer in store ${row.store_id}`,
      );
    }
    for (const offer of offers) {
      ids.add(offer.id);
    }
  }
  for (const offerId of ids) {
    await tx`insert into sps_cm_funnels_to_offers(funnel_id,offer_id) values(${row.id},${offerId}) on conflict do nothing`;
  }
  const { stages, ...metadata } = definition;
  // A former draft can differ from its last runnable publication. Keep the original input recoverable.
  const stored = {
    ...metadata,
    ...(priorEdit ? { previousDraft: priorEdit } : {}),
  };
  await tx`update sps_cm_funnel set definition=${tx.json(JSON.parse(JSON.stringify(stored)))}, name=${name},bindings=${tx.json({ formIds: bindings.formIds, storeWide: !bindings.formIds.length && !ids.size })} where id=${row.id}`;
}

async function migrateHistory(tx: TransactionSql, hasEvents: boolean) {
  const tasks = await tx`select * from sps_cm_task order by id`;
  for (const task of tasks) {
    await tx`insert into sps_cm_funnels_to_tasks(funnel_id,task_id,variant) values(${task.funnel_id},${task.id},'primary') on conflict(funnel_id,task_id) do nothing`;
    const events = hasEvents
      ? await tx`select * from sps_cm_task_event where task_id=${task.id} order by revision`
      : [];
    if (!events.length) {
      throw new Error(`Task ${task.id} has no opening history`);
    }
    let key = events[0]?.detail?.stageId ?? task.stage_id;
    let status = "active";
    for (const event of events) {
      const detail: ITaskEventDetail = { ...event.detail };
      key = detail.stageId ?? key;
      const stageId = stageUuid(key, task.funnel_id);
      const [stage] =
        await tx`select configuration from sps_cm_stage where id=${stageId}`;
      if (!stage) {
        if (task.status !== "closed" && task.stage_id === key) {
          throw new Error(
            `Open task ${task.id} references missing stage ${key}`,
          );
        }
        // Before stage records existed, a closed task's old stage could be removed from every saved definition.
        await writeStage(tx, task.funnel_id, {
          id: key,
          name: key,
          archived: true,
          instruction: "",
          actions: [],
        });
      }
      const configuration = stage?.configuration;
      if (event.kind === "opened") {
        detail.productId ??= task.product_id ?? undefined;
        detail.offerId ??= task.offer_id ?? undefined;
        detail.publicationId ??= task.publication_id;
      }
      if (event.kind === "closed" || event.kind === "deadline-reached") {
        status = "closed";
      } else if (
        event.kind === "transitioned" ||
        event.kind === "opened" ||
        event.kind === "migrated"
      ) {
        const action = configuration?.actions.find(
          (item: IFunnelStage["actions"][number]) =>
            item.id === detail.actionId,
        );
        status = configuration?.waiting ? "waiting" : "active";
        if (!configuration || configuration.archived) {
          status = "unknown";
        }
        if (
          event.kind === "transitioned" &&
          detail.previousStageId === key &&
          action?.outcome
        ) {
          status = "closed";
        }
      } else if (
        event.kind === "customer-message" &&
        status === "waiting" &&
        configuration?.waiting?.expectedEvent === "message"
      ) {
        status = "active";
      }
      if (event.revision === task.revision) {
        status = task.status;
      }
      const comment =
        detail.reason ??
        (detail.evidence?.kind === "manual" ? detail.evidence.reason : null);
      await tx`insert into sps_cm_tasks_to_stages(id,created_at,task_id,stage_id,status,comment,revision,assignment_revision,kind,actor_id,actor_kind,cause_id,operation_key,operation_digest,detail)
        values(${event.id},${event.created_at},${task.id},${stageId},${status},${comment},${event.revision},${event.assignment_revision},${event.kind},${event.actor_id},${event.actor_kind},${event.cause_id},${event.operation_key},${event.operation_digest},${tx.json(JSON.parse(JSON.stringify(detail)))}) on conflict(id) do nothing`;
    }
    if (!task.offer_id && task.product_id) {
      const offers =
        await tx`select id from sps_ee_ss_to_ps_vn7 where se_id=${task.store_id} and pt_id=${task.product_id}`;
      for (const offer of offers) {
        await tx`insert into sps_cm_tasks_to_offers(task_id,offer_id) values(${task.id},${offer.id}) on conflict do nothing`;
      }
    } else if (task.offer_id) {
      await tx`insert into sps_cm_tasks_to_offers(task_id,offer_id) select ${task.id},id from sps_ee_ss_to_ps_vn7 where id=${task.offer_id} on conflict do nothing`;
    }
    if (task.order_id) {
      await tx`insert into sps_cm_tasks_to_orders(task_id,order_id) select ${task.id},id from sps_ee_order where id=${task.order_id} on conflict do nothing`;
    }
  }
}

async function backfillStageStates(tx: TransactionSql) {
  // The task and its old history must describe the same revision while the state is materialized.
  await tx`lock table sps_cm_funnel, sps_cm_task, sps_cm_tasks_to_stages in share row exclusive mode`;
  await tx`with missing as (
    select t.*, ft.funnel_id from sps_cm_task t
    join sps_cm_funnels_to_tasks ft on ft.task_id=t.id and ft.variant='primary'
    where not exists (select from sps_cm_tasks_to_stages r where r.task_id=t.id and r.variant <> 'history')
  ), stages as (
    select t.id as task_id, fs.stage_id from missing t
    join sps_cm_funnels_to_stages fs on fs.funnel_id=t.funnel_id
    join sps_cm_stage s on s.id=fs.stage_id
    where s.key=t.stage_id or (t.status <> 'closed' and t.opening_key not like 'store-employee-training:%'
        and coalesce((s.configuration->>'archived')::boolean,false)=false)
    union
    select t.id, r.stage_id from missing t join sps_cm_tasks_to_stages r on r.task_id=t.id
    where r.kind in ('opened','transitioned','migrated','closed','deadline-reached')
  )
  insert into sps_cm_tasks_to_stages (task_id,stage_id,variant,revision,assignment_revision,kind,status,operation_key,operation_digest,detail)
  select t.id,s.id,case
    when s.key=t.stage_id and t.status <> 'closed' then 'current'
    when s.key=t.stage_id and t.outcome='completed' then 'completed'
    when s.key=t.stage_id then 'closed'
    when exists(select from sps_cm_tasks_to_stages r where r.task_id=t.id and r.kind='transitioned' and r.detail->>'previousStageId'=s.key) then 'completed'
    else 'pending' end,
    t.revision,t.assignment_revision,'stage-state','unknown',s.key,'',jsonb_build_object('stageId',s.key)
  from stages x join missing t on t.id=x.task_id join sps_cm_stage s on s.id=x.stage_id`;
}

async function main() {
  const client = getPostgresClient();
  try {
    await client.begin(async (tx) => {
      const [legacy] =
        await tx`select exists(select 1 from information_schema.columns where table_schema='public' and table_name='sps_cm_task' and column_name='funnel_id') as needed,
        to_regclass('public.sps_cm_task_event') is not null as events,
        to_regclass('public.sps_cm_funnel_publication') is not null as publications`;
      if (!legacy.needed) {
        await backfillStageStates(tx);
        return;
      }
      await tx`lock table sps_cm_task,sps_cm_funnel in share row exclusive mode`;
      const funnels = await tx<
        IFunnelRow[]
      >`select * from sps_cm_funnel order by id`;
      for (const funnel of funnels) {
        const publications = legacy.publications
          ? await tx<
              IPublication[]
            >`select * from sps_cm_funnel_publication where funnel_id=${funnel.id} order by version`
          : [];
        await migrateFunnel(tx, funnel, publications);
      }
      await migrateHistory(tx, legacy.events);
      await backfillStageStates(tx);
    });
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
