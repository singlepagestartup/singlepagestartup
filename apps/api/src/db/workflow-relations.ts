import { v5 as stageUuid } from "uuid";
import { operationDigest } from "@sps/crm/models/task/backend/app/api/src/lib/service/singlepage/utils";
import type { TransactionSql } from "postgres";
import { getPostgresClient } from "@sps/shared-backend-database-config";

async function exists(tx: TransactionSql, table: string) {
  const [row] =
    await tx`SELECT to_regclass(${"public." + table}) IS NOT NULL AS present`;
  return row.present === true;
}

async function releaseMissingAssignees(tx: TransactionSql) {
  const [state] =
    await tx`select exists(select from information_schema.columns where table_schema='public' and table_name='sps_cm_task' and column_name='assignee_id') as legacy`;
  if (!state.legacy) {
    return;
  }
  const hasMessages = await exists(tx, "sl_message_to_crm_task_event");
  const missing =
    await tx`select t.* from sps_cm_task t where assignee_id is not null
    and not exists(select from sps_rc_subject s where s.id=t.assignee_id) order by t.id for update`;
  for (const task of missing) {
    const previous = task.assignment_revision;
    const revision = previous + 1;
    const operationKey = `migration:missing-assignee:${previous}`;
    const detail = {
      assigneeId: task.assignee_id,
      stageId: task.stage_id,
      assignmentRevision: revision,
      reason:
        "The assigned subject was removed before task participants were migrated",
    };
    const digest = operationDigest("assignment-released", {
      taskId: task.id,
      operationKey,
      assigneeId: task.assignee_id,
    });
    // Only the lease changes. Keep the reminder number and scheduled delivery time intact.
    const timer = task.timer
      ? {
          ...task.timer,
          key: `${task.id}:${task.stage_id}:${task.waiting_revision}:${revision}:${task.timer.kind}${task.timer.kind === "reminder" ? ":" + task.timer.number : ""}`,
        }
      : null;
    await tx`insert into sps_cm_tasks_to_stages(task_id,stage_id,revision,assignment_revision,kind,status,comment,actor_kind,operation_key,operation_digest,detail)
      values(${task.id},${stageUuid(task.stage_id, task.funnel_id)},${task.revision + 1},${revision},'assignment-released',${task.status},${detail.reason},'system',${operationKey},${digest},${tx.json(detail)})`;
    if (hasMessages) {
      await tx`update sl_message_to_crm_task_event m set pending=false from sps_cm_tasks_to_stages s
        where s.task_id=${task.id} and s.assignment_revision<=${previous} and m.crm_task_event_id=s.id and m.pending`;
    }
    await tx`update sps_cm_tasks_to_stages set pending=false where task_id=${task.id} and assignment_revision<=${previous} and pending`;
    await tx`update sps_cm_task set assignee_id=null,assignee_kind=null,assignment_expires_at=null,
      assignment_revision=${revision},revision=revision+1,updated_at=now(),timer=${timer ? tx.json(timer) : null} where id=${task.id}`;
  }
}

async function migrateParticipants(tx: TransactionSql) {
  const [schema] =
    await tx`SELECT EXISTS (SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sps_cm_task' AND column_name = 'customer_id') AS legacy`;
  if (!schema.legacy) {
    return;
  }
  await tx`LOCK TABLE sps_cm_task, rc_subject_to_crm_task IN SHARE ROW EXCLUSIVE MODE`;
  await tx`INSERT INTO rc_subject_to_crm_task (crm_task_id, subject_id, variant, created_at, updated_at)
    SELECT t.id, p.subject_id, p.role, t.created_at, t.updated_at
    FROM sps_cm_task t CROSS JOIN LATERAL
      (VALUES ('customer', t.customer_id), ('assignee', t.assignee_id)) p(role, subject_id)
    WHERE p.subject_id IS NOT NULL ON CONFLICT (crm_task_id, variant) DO NOTHING`;
  const [mismatch] = await tx`SELECT t.id FROM sps_cm_task t
    LEFT JOIN rc_subject_to_crm_task c ON c.crm_task_id=t.id AND c.variant='customer'
    LEFT JOIN rc_subject_to_crm_task a ON a.crm_task_id=t.id AND a.variant='assignee'
    WHERE c.subject_id IS DISTINCT FROM t.customer_id OR a.subject_id IS DISTINCT FROM t.assignee_id LIMIT 1`;
  if (mismatch) {
    throw new Error(
      "The migrated participants differ from the original CRM task " +
        mismatch.id,
    );
  }
}

async function migrateChats(tx: TransactionSql) {
  if (await exists(tx, "sl_thread_to_crm_task")) {
    await tx`LOCK TABLE sl_thread_to_crm_task, sl_cs_to_ts_v33, sl_chat_to_crm_task IN SHARE ROW EXCLUSIVE MODE`;
    const [invalid] = await tx`SELECT l.id FROM sl_thread_to_crm_task l
      LEFT JOIN sl_cs_to_ts_v33 ct ON ct.td_id=l.thread_id GROUP BY l.id HAVING COUNT(DISTINCT ct.ct_id) <> 1 LIMIT 1`;
    if (invalid) {
      throw new Error(
        "Cannot identify one chat for legacy task link " + invalid.id,
      );
    }
    await tx`INSERT INTO sl_chat_to_crm_task (id, created_at, updated_at, variant, order_index, class_name, chat_id, crm_task_id, consultation_task_id, memory_project_id)
      SELECT DISTINCT l.id,l.created_at,l.updated_at,l.variant,l.order_index,l.class_name,ct.ct_id,l.crm_task_id,l.consultation_task_id,l.memory_project_id
      FROM sl_thread_to_crm_task l JOIN sl_cs_to_ts_v33 ct ON ct.td_id=l.thread_id ON CONFLICT (id) DO NOTHING`;
    const [missing] = await tx`SELECT l.id FROM sl_thread_to_crm_task l
      JOIN sl_cs_to_ts_v33 ct ON ct.td_id=l.thread_id
      LEFT JOIN sl_chat_to_crm_task n ON n.id=l.id AND n.chat_id=ct.ct_id AND n.crm_task_id=l.crm_task_id
      AND n.memory_project_id IS NOT DISTINCT FROM l.memory_project_id
      AND n.consultation_task_id IS NOT DISTINCT FROM l.consultation_task_id
      WHERE n.id IS NULL LIMIT 1`;
    if (missing) {
      throw new Error("Incomplete chat migration for task link " + missing.id);
    }
    await tx`DROP TABLE sl_thread_to_crm_task`;
  }
  if (await exists(tx, "sl_message_to_crm_task_event")) {
    await tx`LOCK TABLE sl_message_to_crm_task_event IN SHARE ROW EXCLUSIVE MODE`;
    await tx`update sps_cm_tasks_to_stages s set pending=m.pending,queued_at=m.updated_at,
      detail=s.detail || jsonb_build_object('messageId',m.message_id)
      from sl_message_to_crm_task_event m where s.id=m.crm_task_event_id
      and (s.detail->>'messageId' is null or s.detail->>'messageId'=m.message_id::text)`;
    const [missing] = await tx`SELECT l.id FROM sl_message_to_crm_task_event l
      LEFT JOIN sps_cm_tasks_to_stages s ON s.id=l.crm_task_event_id
      WHERE s.id IS NULL OR s.detail->>'messageId' IS DISTINCT FROM l.message_id::text OR s.pending IS DISTINCT FROM l.pending LIMIT 1`;
    if (missing) {
      throw new Error("Unmigrated work message " + missing.id);
    }
    await tx`DROP TABLE sl_message_to_crm_task_event`;
  }
}

async function migrateExperts(tx: TransactionSql) {
  const [legacy] =
    await tx`SELECT EXISTS (SELECT FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sl_pe_to_ee_me_ps_4b2' AND column_name='offer_id') AS present`;
  if (!legacy.present) {
    return;
  }
  await tx`LOCK TABLE sl_pe_to_ee_me_ps_4b2, rc_ss_to_ee_me_ps_whq IN SHARE ROW EXCLUSIVE MODE`;
  const [ambiguous] = await tx`SELECT e.id FROM sl_pe_to_ee_me_ps_4b2 e
    LEFT JOIN rc_ss_to_sl_me_ps_ges p ON p.sl_me_pe_id=e.pe_id AND p.variant='default'
    WHERE e.variant='store-expert' GROUP BY e.id HAVING COUNT(DISTINCT p.st_id) <> 1 LIMIT 1`;
  if (ambiguous) {
    throw new Error(
      "Cannot identify one subject for product expert link " + ambiguous.id,
    );
  }
  await tx`CREATE TEMP TABLE expert_product_mapping ON COMMIT DROP AS
    SELECT DISTINCT e.id, p.st_id AS subject_id, offer.pt_id AS product_id
    FROM sl_pe_to_ee_me_ps_4b2 e JOIN rc_ss_to_sl_me_ps_ges p ON p.sl_me_pe_id=e.pe_id AND p.variant='default'
    JOIN sps_ee_ss_to_ps_vn7 offer ON offer.se_id=e.store_id AND (
      e.offer_id = offer.id OR e.ee_me_pt_id=offer.pt_id OR EXISTS(
        SELECT FROM sps_ee_cs_to_ps_d4v cp WHERE cp.cy_id=e.category_id AND cp.pt_id=offer.pt_id))
    WHERE e.variant='store-expert'`;
  const [missing] =
    await tx`SELECT id FROM sl_pe_to_ee_me_ps_4b2 e WHERE variant='store-expert'
    AND NOT EXISTS(SELECT FROM expert_product_mapping m WHERE m.id=e.id) LIMIT 1`;
  if (missing) {
    throw new Error(
      "Cannot determine the product for expert assignment " + missing.id,
    );
  }
  await tx`INSERT INTO rc_ss_to_ee_me_ps_whq (st_id, ee_me_pt_id, variant)
    SELECT DISTINCT subject_id, product_id, 'store-expert' FROM expert_product_mapping m
    WHERE NOT EXISTS (SELECT FROM rc_ss_to_ee_me_ps_whq dest
      WHERE dest.st_id=m.subject_id AND dest.ee_me_pt_id=m.product_id AND dest.variant='store-expert')`;
  await tx`DELETE FROM sl_pe_to_ee_me_ps_4b2 WHERE variant='store-expert'
    AND EXISTS(SELECT FROM expert_product_mapping m WHERE m.id=sl_pe_to_ee_me_ps_4b2.id)`;
}

const db = getPostgresClient();
try {
  await db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended('sps.crm.work-relations',0))`;
    await releaseMissingAssignees(tx);
    await migrateParticipants(tx);
    await migrateChats(tx);
    await migrateExperts(tx);
  });
} finally {
  await db.end();
}
