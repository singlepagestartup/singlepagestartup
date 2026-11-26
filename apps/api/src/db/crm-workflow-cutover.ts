import { getPostgresClient } from "@sps/shared-backend-database-config";

const retiredTables = [
  "sps_cm_funnels_to_publications",
  "sps_cm_tasks_to_publications",
  "sps_cm_tasks_to_events",
  "sps_cm_tasks_to_products",
  "sps_cm_funnels_to_stores",
  "sps_cm_task_event",
  "sps_cm_funnel_publication",
];

const db = getPostgresClient();
try {
  await db.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtextextended('sps.crm.work-relations',0))`;
    const [legacy] =
      await tx`select exists(select from information_schema.columns where table_schema='public' and table_name='sps_cm_task' and column_name='customer_id') as participants,
      to_regclass('public.sps_cm_task_event') is not null as events`;
    if (legacy.participants) {
      const [unlinked] =
        await tx`select t.id from sps_cm_task t left join sps_cm_funnels_to_tasks f on f.task_id=t.id and f.funnel_id=t.funnel_id and f.variant='primary'
        left join rc_subject_to_crm_task c on c.crm_task_id=t.id and c.variant='customer'
        left join rc_subject_to_crm_task a on a.crm_task_id=t.id and a.variant='assignee'
        where f.id is null or c.subject_id is distinct from t.customer_id or a.subject_id is distinct from t.assignee_id limit 1`;
      if (unlinked) {
        throw new Error(
          `Finalize requires migrated funnel and participants for task ${unlinked.id}`,
        );
      }
    }
    if (legacy.events) {
      const [missing] =
        await tx`select e.id from sps_cm_task_event e left join sps_cm_tasks_to_stages s on s.id=e.id where s.id is null
        or s.task_id<>e.task_id or s.revision<>e.revision or s.operation_digest<>e.operation_digest or not(s.detail @> e.detail) limit 1`;
      if (missing) {
        throw new Error(
          `Finalize requires migrated task stage history for event ${missing.id}`,
        );
      }
    }
    const [priorDraft] =
      await tx`select exists(select from sps_cm_funnel where definition ? 'previousDraft') as present`;
    if (priorDraft.present) {
      await tx`create schema if not exists sps_crm_archive`;
      await tx`create table if not exists sps_crm_archive.funnel_edits as select id,revision,definition->'previousDraft' as draft from sps_cm_funnel where definition ? 'previousDraft'`;
      await tx`update sps_cm_funnel f set definition=definition-'previousDraft' where definition ? 'previousDraft'
        and exists(select from sps_crm_archive.funnel_edits a where a.id=f.id and a.revision=f.revision and a.draft=f.definition->'previousDraft')`;
    }
    for (const table of retiredTables) {
      const [existing] =
        await tx`select to_regclass(${"public." + table}) is not null as present`;
      if (!existing.present) {
        continue;
      }
      await tx`create schema if not exists sps_crm_archive`;
      await tx`alter table ${tx("public." + table)} set schema sps_crm_archive`;
      await tx`drop trigger if exists sps_consistency_rows on ${tx("sps_crm_archive." + table)}`;
      await tx`drop trigger if exists sps_consistency_truncate on ${tx("sps_crm_archive." + table)}`;
    }
    // Archived foreign keys must neither prevent deletion of live records nor cascade into the archive.
    const dependencies =
      await tx`select c.conname,r.relname from pg_constraint c join pg_class r on r.oid=c.conrelid
      join pg_namespace n on n.oid=r.relnamespace join pg_class target on target.oid=c.confrelid join pg_namespace tn on tn.oid=target.relnamespace
      where c.contype='f' and n.nspname='sps_crm_archive' and tn.nspname='public'`;
    for (const fk of dependencies) {
      await tx`alter table ${tx("sps_crm_archive." + fk.relname)} drop constraint ${tx(fk.conname)}`;
    }
  });
} finally {
  await db.end();
}
