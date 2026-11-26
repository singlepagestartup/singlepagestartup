import { getPostgresClient } from "@sps/shared-backend-database-config";
import type { TransactionSql } from "postgres";

const db = getPostgresClient();
const marker = "sps.cutover.social-chat-ownership.v1";

async function candidates(tx: TransactionSql) {
  return tx<{ chat_id: string; subject_id: string; source: string }[]>`
    WITH personal_profiles AS (
      SELECT sl_me_pe_id AS profile_id, (array_agg(st_id))[1] AS subject_id,
             min(created_at) AS linked_at
      FROM rc_ss_to_sl_me_ps_ges
      GROUP BY sl_me_pe_id
      HAVING count(*) = 1 AND bool_and(variant = 'default')
    ),
    -- The opener created the dedicated chat, the primary thread and the task
    -- association in the same transaction. CRM stores its opening timestamp at
    -- millisecond precision. A chat attached by a manager later is ineligible.
    opened_tasks AS (
      SELECT c.id AS chat_id, e.actor_id AS subject_id, 'task-opening' AS source
      FROM sl_chat c
      JOIN sl_chat_to_crm_task l ON l.chat_id = c.id AND l.created_at = c.created_at
      JOIN sps_cm_task t ON t.id = l.crm_task_id
      JOIN sps_cm_tasks_to_stages e ON e.task_id = t.id AND e.kind = 'opened'
      WHERE c.variant = 'customer-work' AND t.created_at = c.created_at::timestamp(3)
        AND e.created_at = t.created_at AND e.operation_key = t.opening_key
        AND split_part(t.opening_key, ':', 1) IN ('store-work', 'store-test', 'crm-form')
        AND NOT EXISTS (SELECT 1 FROM sl_chat_to_crm_task other
                        WHERE other.id <> l.id AND (other.chat_id = c.id OR other.crm_task_id = t.id))
        AND EXISTS (SELECT 1 FROM sl_cs_to_ts_v33 ct
                    WHERE ct.ct_id = c.id AND ct.variant = 'default' AND ct.created_at = c.created_at)
        AND EXISTS (SELECT 1 FROM sl_ps_to_cs_m2s m WHERE m.ct_id = c.id AND m.created_at = c.created_at)
    ),
    -- Employee chat source and slug are written together as store/actor/employee.
    -- Both the trainer and the employee must also own distinct member profiles.
    employee_chats AS (
      SELECT c.id AS chat_id, actor.id AS subject_id, 'employee-chat' AS source
      FROM sl_chat c
      JOIN sps_rc_subject actor ON actor.id::text = split_part(c.source_system_id, ':', 2)
      JOIN sps_rc_subject employee ON employee.id::text = split_part(c.source_system_id, ':', 3)
      WHERE c.variant = 'store-employee' AND actor.id <> employee.id
        AND c.source_system_id ~ '^[0-9a-f-]{36}:[0-9a-f-]{36}:[0-9a-f-]{36}$'
        AND c.slug = 'store-employee-training-' || replace(c.source_system_id, ':', '-')
        AND EXISTS (SELECT 1 FROM rc_ss_to_ee_me_ss_htr r WHERE r.st_id = employee.id
                    AND r.ee_me_se_id::text = split_part(c.source_system_id, ':', 1) AND r.variant = 'crm-agent')
        AND EXISTS (SELECT 1 FROM personal_profiles p JOIN sl_ps_to_cs_m2s m ON m.pe_id = p.profile_id
                    WHERE m.ct_id = c.id AND p.subject_id = actor.id)
        AND EXISTS (SELECT 1 FROM personal_profiles p JOIN sl_ps_to_cs_m2s m ON m.pe_id = p.profile_id
                    WHERE m.ct_id = c.id AND p.subject_id = employee.id)
    ),
    -- The legacy social bootstrap linked the requester's personal profile, then
    -- created the first default thread. Later invitations cannot establish ownership.
    first_link_times AS (
      SELECT ct_id, min(created_at) AS linked_at FROM sl_cs_to_ts_v33 GROUP BY ct_id
    ),
    bootstrap_threads AS (
      SELECT ct.ct_id AS chat_id, min(t.created_at) AS started_at
      FROM first_link_times first
      JOIN sl_cs_to_ts_v33 ct ON ct.ct_id = first.ct_id AND ct.created_at = first.linked_at
      JOIN sl_thread t ON t.id = ct.td_id
      GROUP BY ct.ct_id HAVING count(*) = 1 AND bool_and(ct.variant = 'default' AND t.variant = 'default')
    ),
    initial_members AS (
      SELECT c.id AS chat_id, (array_agg(m.pe_id))[1] AS profile_id, c.created_at
      FROM sl_chat c JOIN bootstrap_threads t ON t.chat_id = c.id
      JOIN sl_ps_to_cs_m2s m ON m.ct_id = c.id AND m.created_at <= t.started_at
      WHERE c.variant IN ('default', 'ai-chat') AND c.source_system_id IS NULL
        AND NOT EXISTS (SELECT 1 FROM sl_chat_to_crm_task link WHERE link.chat_id = c.id)
      GROUP BY c.id, c.created_at
      HAVING count(*) = 1 AND bool_and(m.variant = 'default' AND m.created_at >= c.created_at)
    ),
    -- ProfileCollection.create also generated one agent with this chat's ID in
    -- its slug and granted the requester an 'assistant' relation to that profile.
    -- A lone member or an early timestamp in an ordinary group is insufficient.
    project_creators AS (
      SELECT c.id AS chat_id, (array_agg(r.st_id))[1] AS subject_id
      FROM sl_chat c
      JOIN sps_rc_subject agent ON agent.variant = 'agent' AND agent.slug = 'profile-' || c.id::text
      JOIN rc_ss_to_sl_me_ps_ges a ON a.st_id = agent.id AND a.variant = 'default'
      JOIN sl_profile assistant ON assistant.id = a.sl_me_pe_id AND assistant.variant = 'artificial-intelligence'
      JOIN sl_ps_to_cs_m2s member ON member.pe_id = assistant.id AND member.ct_id = c.id
      JOIN rc_ss_to_sl_me_ps_ges r ON r.sl_me_pe_id = assistant.id AND r.variant = 'assistant'
      GROUP BY c.id HAVING count(*) = 1
    ),
    ordinary_chats AS (
      SELECT m.chat_id, p.subject_id, 'ai-project-creator' AS source
      FROM initial_members m JOIN personal_profiles p ON p.profile_id = m.profile_id
      JOIN sl_profile profile ON profile.id = p.profile_id AND profile.variant = 'default'
      JOIN project_creators creator ON creator.chat_id = m.chat_id AND creator.subject_id = p.subject_id
      WHERE p.linked_at <= m.created_at
    ),
    -- In Telegram a positive private chat ID is the user's account ID. Group
    -- chats have a different ID and cannot use this identity proof.
    telegram_accounts AS (
      SELECT account, (array_agg(id))[1] AS id FROM sps_rc_identity
      WHERE provider = 'telegram' GROUP BY account HAVING count(*) = 1
    ),
    telegram_subjects AS (
      SELECT a.account, (array_agg(r.st_id))[1] AS subject_id FROM telegram_accounts a
      JOIN sps_rc_ss_to_is_h58 r ON r.iy_id = a.id GROUP BY a.account
      HAVING count(*) = 1 AND bool_and(r.variant = 'default')
    ),
    telegram_chats AS (
      SELECT c.id AS chat_id, s.subject_id, 'telegram-private' AS source
      FROM sl_chat c JOIN telegram_subjects s ON s.account = c.source_system_id
      WHERE c.variant = 'telegram' AND c.source_system_id ~ '^[1-9][0-9]*$'
        AND c.slug = 'telegram-chat-' || c.source_system_id
        AND NOT EXISTS (SELECT 1 FROM sl_chat other WHERE other.id <> c.id
          AND other.variant = 'telegram' AND other.source_system_id = c.source_system_id)
        AND EXISTS (SELECT 1 FROM personal_profiles p JOIN sl_profile profile ON profile.id = p.profile_id
          JOIN sl_ps_to_cs_m2s m ON m.pe_id = p.profile_id AND m.ct_id = c.id
          WHERE p.subject_id = s.subject_id AND profile.variant = 'telegram'
            AND profile.slug = 'telegram-profile-' || s.subject_id::text)
    ),
    evidence AS (
      SELECT * FROM opened_tasks UNION ALL SELECT * FROM employee_chats
      UNION ALL SELECT * FROM ordinary_chats UNION ALL SELECT * FROM telegram_chats
    )
    SELECT e.chat_id, (array_agg(e.subject_id))[1] AS subject_id, min(e.source) AS source
    FROM evidence e JOIN sps_rc_subject subject ON subject.id = e.subject_id
    WHERE NOT EXISTS (SELECT 1 FROM rc_subject_to_social_chat owner
                      WHERE owner.social_chat_id = e.chat_id AND owner.variant = 'owner')
    GROUP BY e.chat_id HAVING count(*) = 1 ORDER BY e.chat_id`;
}

async function run(tx: TransactionSql, dryRun: boolean) {
  await tx`SELECT pg_advisory_xact_lock(hashtextextended('sps.social.chat-ownership', 0))`;
  if (!dryRun) {
    await tx`LOCK TABLE public.rc_subject_to_social_chat IN SHARE ROW EXCLUSIVE MODE`;
  }
  const [table] = await tx<{ comment: string | null }[]>`
    SELECT obj_description('public.rc_subject_to_social_chat'::regclass, 'pg_class') AS comment`;
  if (table.comment?.split("\n").includes(marker)) {
    console.log("Chat ownership cutover already completed.");
    return;
  }
  const owners = await candidates(tx);
  if (dryRun) {
    console.table(owners);
    console.log(`Eligible chats: ${owners.length}`);
    return;
  }
  let inserted = 0;
  if (owners.length) {
    const rows = owners.map(({ subject_id, chat_id }) => ({
      subject_id,
      social_chat_id: chat_id,
      variant: "owner",
    }));
    const result = await tx`INSERT INTO rc_subject_to_social_chat ${tx(rows)}
      ON CONFLICT DO NOTHING RETURNING id`;
    inserted = result.length;
  }
  // The completion marker prevents a later db:migrate from restoring a revoked grant.
  const comment = table.comment ? `${table.comment}\n${marker}` : marker;
  const [ddl] = await tx<{ statement: string }[]>`
    SELECT format('COMMENT ON TABLE public.rc_subject_to_social_chat IS %L', ${comment}::text) AS statement`;
  await tx.unsafe(ddl.statement);
  console.log(`Restored chat owners: ${inserted}`);
}

try {
  const dryRun = process.argv.includes("--dry-run");
  await db.begin((tx) => run(tx, dryRun));
} finally {
  await db.end();
}
