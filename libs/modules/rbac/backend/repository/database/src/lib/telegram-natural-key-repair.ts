import type postgres from "postgres";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import type { NaturalKeyRepairMode } from "./natural-key-repair";

export interface ITelegramNaturalKeyCounts {
  chatGroups: number;
  chatExtraRows: number;
  profileGroups: number;
  profileExtraRows: number;
  defaultThreadGroups: number;
  defaultThreadExtraRows: number;
  topicThreadGroups: number;
  topicThreadExtraRows: number;
  relationExtraRows: number;
  stalePersonalAiLinks: number;
}

export interface ITelegramNaturalKeyChanges {
  chatsDeleted: number;
  profilesDeleted: number;
  threadsDeleted: number;
  relationsInserted: number;
  relationsDeleted: number;
  stalePersonalAiLinksDeleted: number;
}

export interface ITelegramNaturalKeyRepairResult {
  mode: NaturalKeyRepairMode;
  skipped: boolean;
  before: ITelegramNaturalKeyCounts;
  after: ITelegramNaturalKeyCounts;
  changes: ITelegramNaturalKeyChanges;
}

interface IInspectionRow {
  chat_groups: number | string;
  chat_extra_rows: number | string;
  profile_groups: number | string;
  profile_extra_rows: number | string;
  default_thread_groups: number | string;
  default_thread_extra_rows: number | string;
  topic_thread_groups: number | string;
  topic_thread_extra_rows: number | string;
  relation_extra_rows: number | string;
  stale_personal_ai_links: number | string;
}

export interface ITelegramNaturalKeyRepairTables {
  identity: string;
  subjectsToIdentities: string;
  subjectsToProfiles: string;
  profile: string;
  chat: string;
  thread: string;
  profilesToChats: string;
  chatsToThreads: string;
  chatsToMessages: string;
  chatsToActions: string;
  threadsToMessages: string;
  threadsToActions: string;
}

const defaultTables: ITelegramNaturalKeyRepairTables = {
  identity: "sps_rc_identity",
  subjectsToIdentities: "sps_rc_ss_to_is_h58",
  subjectsToProfiles: "rc_ss_to_sl_me_ps_ges",
  profile: "sl_profile",
  chat: "sl_chat",
  thread: "sl_thread",
  profilesToChats: "sl_ps_to_cs_m2s",
  chatsToThreads: "sl_cs_to_ts_v33",
  chatsToMessages: "sl_cs_to_ms_e6r",
  chatsToActions: "sl_cs_to_as_b9b",
  threadsToMessages: "sl_ts_to_ms_2n4",
  threadsToActions: "sl_ts_to_as_4vv",
};

const zeroCounts: ITelegramNaturalKeyCounts = {
  chatGroups: 0,
  chatExtraRows: 0,
  profileGroups: 0,
  profileExtraRows: 0,
  defaultThreadGroups: 0,
  defaultThreadExtraRows: 0,
  topicThreadGroups: 0,
  topicThreadExtraRows: 0,
  relationExtraRows: 0,
  stalePersonalAiLinks: 0,
};

const zeroChanges: ITelegramNaturalKeyChanges = {
  chatsDeleted: 0,
  profilesDeleted: 0,
  threadsDeleted: 0,
  relationsInserted: 0,
  relationsDeleted: 0,
  stalePersonalAiLinksDeleted: 0,
};

async function tablesExist(
  sql: postgres.Sql,
  tables: ITelegramNaturalKeyRepairTables,
) {
  const tableNames = Object.values(tables);
  const rows = await sql<{ table_name: string; resolved: string | null }[]>`
    SELECT table_name, to_regclass(table_name)::text AS resolved
    FROM unnest(${sql.array(tableNames)}::text[]) AS table_name
  `;
  const availability = new Map(
    rows.map((row) => [row.table_name, Boolean(row.resolved)]),
  );
  const prerequisiteTables = [
    tables.identity,
    tables.subjectsToIdentities,
    tables.subjectsToProfiles,
  ];
  const prerequisiteCount = prerequisiteTables.filter((table) =>
    availability.get(table),
  ).length;

  // On a fresh database Social migrations intentionally run before RBAC.
  // The repair has no legacy Telegram ownership graph to inspect yet.
  if (prerequisiteCount === 0) {
    return false;
  }

  const existingCount = rows.filter((row) => Boolean(row.resolved)).length;

  if (
    prerequisiteCount < prerequisiteTables.length ||
    existingCount < tableNames.length
  ) {
    const missing = rows
      .filter((row) => !row.resolved)
      .map((row) => row.table_name);
    throw new Error(
      `Data integrity error. Telegram natural-key repair is missing tables: ${missing.join(", ")}`,
    );
  }

  return existingCount === tableNames.length;
}

function pairDuplicateCount(table: string, columns: string[]) {
  return `
    SELECT COALESCE(SUM(row_count - 1), 0)::bigint
    FROM (
      SELECT COUNT(*)::bigint AS row_count
      FROM "${table}"
      GROUP BY ${columns.map((column) => `"${column}"`).join(", ")}
      HAVING COUNT(*) > 1
    ) duplicate_pairs
  `;
}

function inspectionQuery(tables: ITelegramNaturalKeyRepairTables) {
  const relationCounts = [
    pairDuplicateCount(tables.subjectsToProfiles, ["st_id", "sl_me_pe_id"]),
    pairDuplicateCount(tables.profilesToChats, ["pe_id", "ct_id"]),
    pairDuplicateCount(tables.chatsToThreads, ["ct_id", "td_id"]),
    pairDuplicateCount(tables.chatsToMessages, ["ct_id", "me_id"]),
    pairDuplicateCount(tables.chatsToActions, ["ct_id", "an_id"]),
    pairDuplicateCount(tables.threadsToMessages, ["td_id", "me_id"]),
    pairDuplicateCount(tables.threadsToActions, ["td_id", "ac_id"]),
  ];

  return `
    WITH chat_groups AS (
      SELECT COUNT(*)::bigint AS row_count
      FROM "${tables.chat}"
      WHERE variant = 'telegram' AND source_system_id IS NOT NULL
      GROUP BY source_system_id
      HAVING COUNT(*) > 1
    ),
    profile_groups AS (
      SELECT relation.st_id, COUNT(DISTINCT profile.id)::bigint AS row_count
      FROM "${tables.subjectsToProfiles}" relation
      INNER JOIN "${tables.profile}" profile
        ON profile.id = relation.sl_me_pe_id
      WHERE profile.variant = 'telegram'
      GROUP BY relation.st_id
      HAVING COUNT(DISTINCT profile.id) > 1
    ),
    default_thread_groups AS (
      SELECT relation.ct_id, COUNT(DISTINCT thread.id)::bigint AS row_count
      FROM "${tables.chatsToThreads}" relation
      INNER JOIN "${tables.thread}" thread ON thread.id = relation.td_id
      WHERE thread.variant = 'default'
      GROUP BY relation.ct_id
      HAVING COUNT(DISTINCT thread.id) > 1
    ),
    topic_thread_groups AS (
      SELECT
        relation.ct_id,
        thread.source_system_id,
        COUNT(DISTINCT thread.id)::bigint AS row_count
      FROM "${tables.chatsToThreads}" relation
      INNER JOIN "${tables.thread}" thread ON thread.id = relation.td_id
      WHERE thread.variant = 'telegram'
        AND thread.source_system_id IS NOT NULL
      GROUP BY relation.ct_id, thread.source_system_id
      HAVING COUNT(DISTINCT thread.id) > 1
    ),
    stale_personal_ai_links AS (
      SELECT relation.id
      FROM "${tables.profilesToChats}" relation
      INNER JOIN "${tables.chat}" chat ON chat.id = relation.ct_id
      INNER JOIN "${tables.profile}" profile ON profile.id = relation.pe_id
      INNER JOIN "${tables.identity}" identity
        ON identity.provider = 'telegram'
        AND identity.account = chat.source_system_id
      INNER JOIN "${tables.subjectsToIdentities}" subject_identity
        ON subject_identity.iy_id = identity.id
      WHERE chat.variant = 'telegram'
        AND chat.source_system_id ~ '^[0-9]+$'
        AND relation.variant = 'telegram-personal-ai-agent'
        AND profile.slug <> 'telegram-personal-ai-agent-' || subject_identity.st_id::text
    )
    SELECT
      (SELECT COUNT(*) FROM chat_groups)::bigint AS chat_groups,
      COALESCE((SELECT SUM(row_count - 1) FROM chat_groups), 0)::bigint
        AS chat_extra_rows,
      (SELECT COUNT(*) FROM profile_groups)::bigint AS profile_groups,
      COALESCE((SELECT SUM(row_count - 1) FROM profile_groups), 0)::bigint
        AS profile_extra_rows,
      (SELECT COUNT(*) FROM default_thread_groups)::bigint
        AS default_thread_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM default_thread_groups),
        0
      )::bigint AS default_thread_extra_rows,
      (SELECT COUNT(*) FROM topic_thread_groups)::bigint
        AS topic_thread_groups,
      COALESCE(
        (SELECT SUM(row_count - 1) FROM topic_thread_groups),
        0
      )::bigint AS topic_thread_extra_rows,
      (${relationCounts.map((query) => `(${query})`).join(" + ")})::bigint
        AS relation_extra_rows,
      (SELECT COUNT(*) FROM stale_personal_ai_links)::bigint
        AS stale_personal_ai_links
  `;
}

async function inspect(
  sql: postgres.Sql,
  tables: ITelegramNaturalKeyRepairTables,
): Promise<ITelegramNaturalKeyCounts> {
  const [row] = await sql.unsafe<IInspectionRow[]>(inspectionQuery(tables));

  return {
    chatGroups: Number(row?.chat_groups ?? 0),
    chatExtraRows: Number(row?.chat_extra_rows ?? 0),
    profileGroups: Number(row?.profile_groups ?? 0),
    profileExtraRows: Number(row?.profile_extra_rows ?? 0),
    defaultThreadGroups: Number(row?.default_thread_groups ?? 0),
    defaultThreadExtraRows: Number(row?.default_thread_extra_rows ?? 0),
    topicThreadGroups: Number(row?.topic_thread_groups ?? 0),
    topicThreadExtraRows: Number(row?.topic_thread_extra_rows ?? 0),
    relationExtraRows: Number(row?.relation_extra_rows ?? 0),
    stalePersonalAiLinks: Number(row?.stale_personal_ai_links ?? 0),
  };
}

async function copyRelations(props: {
  sql: postgres.TransactionSql;
  mapTable: string;
  relationTable: string;
  parentColumn: string;
  targetColumn: string;
}) {
  return props.sql.unsafe(`
    INSERT INTO "${props.relationTable}" (
      id,
      created_at,
      updated_at,
      variant,
      order_index,
      class_name,
      "${props.parentColumn}",
      "${props.targetColumn}"
    )
    SELECT
      gen_random_uuid(),
      NOW(),
      NOW(),
      candidate.variant,
      candidate.order_index,
      candidate.class_name,
      candidate.canonical_id,
      candidate.target_id
    FROM (
      SELECT DISTINCT ON (map.canonical_id, relation."${props.targetColumn}")
        map.canonical_id,
        relation."${props.targetColumn}" AS target_id,
        relation.variant,
        relation.order_index,
        relation.class_name,
        relation.created_at,
        relation.id
      FROM "${props.relationTable}" relation
      INNER JOIN ${props.mapTable} map
        ON map.old_id = relation."${props.parentColumn}"
      WHERE map.old_id <> map.canonical_id
      ORDER BY
        map.canonical_id,
        relation."${props.targetColumn}",
        relation.created_at ASC,
        relation.id ASC
    ) candidate
    WHERE NOT EXISTS (
      SELECT 1
      FROM "${props.relationTable}" existing
      WHERE existing."${props.parentColumn}" = candidate.canonical_id
        AND existing."${props.targetColumn}" = candidate.target_id
    )
    RETURNING id
  `);
}

async function deduplicatePair(props: {
  sql: postgres.TransactionSql;
  table: string;
  columns: string[];
}) {
  return props.sql.unsafe(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY ${props.columns.map((column) => `"${column}"`).join(", ")}
          ORDER BY created_at ASC, id ASC
        ) AS row_number
      FROM "${props.table}"
    )
    DELETE FROM "${props.table}" relation
    USING ranked
    WHERE relation.id = ranked.id
      AND ranked.row_number > 1
    RETURNING relation.id
  `);
}

async function deleteMappedParentRelations(props: {
  sql: postgres.TransactionSql;
  mapTable: string;
  relationTable: string;
  parentColumn: string;
}) {
  return props.sql.unsafe(`
    DELETE FROM "${props.relationTable}" relation
    USING ${props.mapTable} map
    WHERE relation."${props.parentColumn}" = map.old_id
      AND map.old_id <> map.canonical_id
    RETURNING relation.id
  `);
}

async function apply(
  sql: postgres.TransactionSql,
  tables: ITelegramNaturalKeyRepairTables,
) {
  await sql.unsafe(
    `LOCK TABLE ${Object.values(tables)
      .map((table) => `"${table}"`)
      .join(", ")} IN SHARE ROW EXCLUSIVE MODE`,
  );

  await sql.unsafe(`
    CREATE TEMP TABLE telegram_chat_repair_map ON COMMIT DROP AS
    SELECT DISTINCT
      id AS old_id,
      FIRST_VALUE(id) OVER (
        PARTITION BY source_system_id
        ORDER BY
          (slug = 'telegram-chat-' || source_system_id) DESC,
          created_at ASC,
          id ASC
      ) AS canonical_id,
      'telegram-chat-' || source_system_id AS expected_slug
    FROM "${tables.chat}"
    WHERE variant = 'telegram' AND source_system_id IS NOT NULL
  `);

  let relationsInserted = 0;
  let relationsDeleted = 0;

  for (const relation of [
    [tables.profilesToChats, "ct_id", "pe_id"],
    [tables.chatsToThreads, "ct_id", "td_id"],
    [tables.chatsToMessages, "ct_id", "me_id"],
    [tables.chatsToActions, "ct_id", "an_id"],
  ] as const) {
    const inserted = await copyRelations({
      sql,
      mapTable: "telegram_chat_repair_map",
      relationTable: relation[0],
      parentColumn: relation[1],
      targetColumn: relation[2],
    });
    relationsInserted += inserted.count;
  }

  await sql.unsafe(`
    CREATE TEMP TABLE telegram_thread_repair_map ON COMMIT DROP AS
    SELECT DISTINCT
      relation.ct_id AS chat_id,
      thread.id AS old_id,
      FIRST_VALUE(thread.id) OVER (
        PARTITION BY
          relation.ct_id,
          CASE
            WHEN thread.variant = 'default' THEN '__default__'
            ELSE thread.source_system_id
          END
        ORDER BY
          (
            thread.slug = CASE
              WHEN thread.variant = 'default'
                THEN 'telegram-thread-' || relation.ct_id::text || '-default'
              ELSE 'telegram-thread-' || relation.ct_id::text || '-' || thread.source_system_id
            END
          ) DESC,
          thread.created_at ASC,
          thread.id ASC
      ) AS canonical_id,
      CASE
        WHEN thread.variant = 'default'
          THEN 'telegram-thread-' || relation.ct_id::text || '-default'
        ELSE 'telegram-thread-' || relation.ct_id::text || '-' || thread.source_system_id
      END AS expected_slug,
      thread.variant AS thread_variant
    FROM "${tables.chatsToThreads}" relation
    INNER JOIN "${tables.thread}" thread ON thread.id = relation.td_id
    WHERE relation.ct_id IN (
        SELECT canonical_id
        FROM telegram_chat_repair_map
      )
      AND (
        thread.variant = 'default'
        OR (thread.variant = 'telegram' AND thread.source_system_id IS NOT NULL)
      )
  `);

  for (const relation of [
    [tables.profilesToChats, "ct_id"],
    [tables.chatsToThreads, "ct_id"],
    [tables.chatsToMessages, "ct_id"],
    [tables.chatsToActions, "ct_id"],
  ] as const) {
    const deleted = await deleteMappedParentRelations({
      sql,
      mapTable: "telegram_chat_repair_map",
      relationTable: relation[0],
      parentColumn: relation[1],
    });
    relationsDeleted += deleted.count;
  }

  const deletedChats = await sql.unsafe(`
    DELETE FROM "${tables.chat}" chat
    USING telegram_chat_repair_map map
    WHERE chat.id = map.old_id AND map.old_id <> map.canonical_id
    RETURNING chat.id
  `);

  await sql.unsafe(`
    UPDATE "${tables.chat}" chat
    SET slug = map.expected_slug, updated_at = NOW()
    FROM telegram_chat_repair_map map
    WHERE chat.id = map.canonical_id AND chat.slug <> map.expected_slug
  `);

  await sql.unsafe(`
    CREATE TEMP TABLE telegram_profile_repair_map ON COMMIT DROP AS
    SELECT DISTINCT
      relation.st_id AS subject_id,
      profile.id AS old_id,
      FIRST_VALUE(profile.id) OVER (
        PARTITION BY relation.st_id
        ORDER BY
          (profile.slug = 'telegram-profile-' || relation.st_id::text) DESC,
          profile.created_at ASC,
          profile.id ASC
      ) AS canonical_id,
      'telegram-profile-' || relation.st_id::text AS expected_slug
    FROM "${tables.subjectsToProfiles}" relation
    INNER JOIN "${tables.profile}" profile
      ON profile.id = relation.sl_me_pe_id
    WHERE profile.variant = 'telegram'
  `);

  const copiedProfileLinks = await copyRelations({
    sql,
    mapTable: "telegram_profile_repair_map",
    relationTable: tables.profilesToChats,
    parentColumn: "pe_id",
    targetColumn: "ct_id",
  });
  relationsInserted += copiedProfileLinks.count;

  const deletedProfileChatLinks = await deleteMappedParentRelations({
    sql,
    mapTable: "telegram_profile_repair_map",
    relationTable: tables.profilesToChats,
    parentColumn: "pe_id",
  });
  relationsDeleted += deletedProfileChatLinks.count;

  const deletedSubjectProfileLinks = await sql.unsafe(`
    DELETE FROM "${tables.subjectsToProfiles}" relation
    USING telegram_profile_repair_map map
    WHERE relation.st_id = map.subject_id
      AND relation.sl_me_pe_id = map.old_id
      AND map.old_id <> map.canonical_id
    RETURNING relation.id
  `);
  relationsDeleted += deletedSubjectProfileLinks.count;

  const deletedProfiles = await sql.unsafe(`
    DELETE FROM "${tables.profile}" profile
    WHERE profile.id IN (
      SELECT old_id
      FROM telegram_profile_repair_map
      WHERE old_id <> canonical_id
    )
      AND NOT EXISTS (
        SELECT 1
        FROM "${tables.subjectsToProfiles}" relation
        WHERE relation.sl_me_pe_id = profile.id
      )
    RETURNING profile.id
  `);

  await sql.unsafe(`
    UPDATE "${tables.profile}" profile
    SET slug = map.expected_slug, updated_at = NOW()
    FROM telegram_profile_repair_map map
    WHERE profile.id = map.canonical_id AND profile.slug <> map.expected_slug
  `);

  for (const relation of [
    [tables.threadsToMessages, "td_id", "me_id"],
    [tables.threadsToActions, "td_id", "ac_id"],
  ] as const) {
    const inserted = await copyRelations({
      sql,
      mapTable: "telegram_thread_repair_map",
      relationTable: relation[0],
      parentColumn: relation[1],
      targetColumn: relation[2],
    });
    relationsInserted += inserted.count;
  }

  for (const relation of [
    [tables.threadsToMessages, "td_id"],
    [tables.threadsToActions, "td_id"],
  ] as const) {
    const deleted = await deleteMappedParentRelations({
      sql,
      mapTable: "telegram_thread_repair_map",
      relationTable: relation[0],
      parentColumn: relation[1],
    });
    relationsDeleted += deleted.count;
  }

  const deletedChatThreadLinks = await sql.unsafe(`
    DELETE FROM "${tables.chatsToThreads}" relation
    USING telegram_thread_repair_map map
    WHERE relation.ct_id = map.chat_id
      AND relation.td_id = map.old_id
      AND map.old_id <> map.canonical_id
    RETURNING relation.id
  `);
  relationsDeleted += deletedChatThreadLinks.count;

  const deletedThreads = await sql.unsafe(`
    DELETE FROM "${tables.thread}" thread
    WHERE thread.id IN (
      SELECT old_id
      FROM telegram_thread_repair_map
      WHERE old_id <> canonical_id
    )
      AND NOT EXISTS (
        SELECT 1
        FROM "${tables.chatsToThreads}" relation
        WHERE relation.td_id = thread.id
      )
    RETURNING thread.id
  `);

  await sql.unsafe(`
    UPDATE "${tables.thread}" thread
    SET slug = map.expected_slug, updated_at = NOW()
    FROM telegram_thread_repair_map map
    WHERE thread.id = map.canonical_id AND thread.slug <> map.expected_slug
  `);

  await sql.unsafe(`
    UPDATE "${tables.chatsToThreads}" relation
    SET
      variant = CASE
        WHEN map.thread_variant = 'default' THEN 'default'
        ELSE 'telegram'
      END,
      updated_at = NOW()
    FROM telegram_thread_repair_map map
    WHERE relation.ct_id = map.chat_id AND relation.td_id = map.canonical_id
  `);

  const stalePersonalAiLinks = await sql.unsafe(`
    DELETE FROM "${tables.profilesToChats}" relation
    USING
      "${tables.chat}" chat,
      "${tables.profile}" profile,
      "${tables.identity}" identity,
      "${tables.subjectsToIdentities}" subject_identity
    WHERE relation.ct_id = chat.id
      AND relation.pe_id = profile.id
      AND identity.provider = 'telegram'
      AND identity.account = chat.source_system_id
      AND subject_identity.iy_id = identity.id
      AND chat.variant = 'telegram'
      AND chat.source_system_id ~ '^[0-9]+$'
      AND relation.variant = 'telegram-personal-ai-agent'
      AND profile.slug <> 'telegram-personal-ai-agent-' || subject_identity.st_id::text
    RETURNING relation.id
  `);

  for (const relation of [
    [tables.subjectsToProfiles, ["st_id", "sl_me_pe_id"]],
    [tables.profilesToChats, ["pe_id", "ct_id"]],
    [tables.chatsToThreads, ["ct_id", "td_id"]],
    [tables.chatsToMessages, ["ct_id", "me_id"]],
    [tables.chatsToActions, ["ct_id", "an_id"]],
    [tables.threadsToMessages, ["td_id", "me_id"]],
    [tables.threadsToActions, ["td_id", "ac_id"]],
  ] as const) {
    const deleted = await deduplicatePair({
      sql,
      table: relation[0],
      columns: [...relation[1]],
    });
    relationsDeleted += deleted.count;
  }

  return {
    chatsDeleted: deletedChats.count,
    profilesDeleted: deletedProfiles.count,
    threadsDeleted: deletedThreads.count,
    relationsInserted,
    relationsDeleted,
    stalePersonalAiLinksDeleted: stalePersonalAiLinks.count,
  };
}

function hasDuplicates(counts: ITelegramNaturalKeyCounts) {
  return Object.values(counts).some((count) => count > 0);
}

export async function repairTelegramNaturalKeys(props: {
  mode: NaturalKeyRepairMode;
  sql?: postgres.Sql;
  tables?: ITelegramNaturalKeyRepairTables;
}): Promise<ITelegramNaturalKeyRepairResult> {
  const sql = props.sql ?? getPostgresClient();
  const tables = props.tables ?? defaultTables;

  if (!(await tablesExist(sql, tables))) {
    return {
      mode: props.mode,
      skipped: true,
      before: { ...zeroCounts },
      after: { ...zeroCounts },
      changes: { ...zeroChanges },
    };
  }

  if (props.mode === "check") {
    const before = await sql.begin(
      "isolation level repeatable read read only",
      (transaction) => inspect(transaction, tables),
    );

    return {
      mode: props.mode,
      skipped: false,
      before,
      after: before,
      changes: { ...zeroChanges },
    };
  }

  return sql.begin(async (transaction) => {
    const before = await inspect(transaction, tables);
    const changes = await apply(transaction, tables);
    const after = await inspect(transaction, tables);

    if (hasDuplicates(after)) {
      throw new Error(
        "Data integrity error. Telegram natural-key repair did not converge.",
      );
    }

    return {
      mode: props.mode,
      skipped: false,
      before,
      after,
      changes,
    };
  });
}
