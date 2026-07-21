/**
 * BDD Suite: Temporary identity and Telegram natural-key repair.
 *
 * Given: legacy identity and Telegram graphs contain duplicate natural keys.
 * When: the deployment-time repair is checked and applied.
 * Then: one canonical graph remains and repeated application is idempotent.
 */

import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import {
  repairIdentityNaturalKeys,
  type IIdentityNaturalKeyRepairTables,
} from "./identity-natural-key-repair";
import {
  repairTelegramNaturalKeys,
  type ITelegramNaturalKeyRepairTables,
} from "./telegram-natural-key-repair";

interface ITestContext {
  sql: postgres.Sql;
  identityTables: IIdentityNaturalKeyRepairTables;
  telegramTables: ITelegramNaturalKeyRepairTables;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier}"`;
}

function createTableNames(): Omit<ITestContext, "sql"> {
  const suffix = randomUUID().replaceAll("-", "");
  const name = (value: string) => `test_${value}_${suffix}`;
  const identity = name("identity");
  const subjectsToIdentities = name("subject_identity");

  return {
    identityTables: {
      identity,
      subjectsToIdentities,
    },
    telegramTables: {
      identity,
      subjectsToIdentities,
      subjectsToProfiles: name("subject_profile"),
      profile: name("profile"),
      chat: name("chat"),
      thread: name("thread"),
      profilesToChats: name("profile_chat"),
      chatsToThreads: name("chat_thread"),
      chatsToMessages: name("chat_message"),
      chatsToActions: name("chat_action"),
      threadsToMessages: name("thread_message"),
      threadsToActions: name("thread_action"),
    },
  };
}

async function createRelationTable(props: {
  sql: postgres.Sql;
  table: string;
  leftColumn: string;
  rightColumn: string;
}) {
  await props.sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(props.table)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      variant text NOT NULL DEFAULT 'default',
      order_index integer NOT NULL DEFAULT 0,
      class_name text,
      "${props.leftColumn}" uuid NOT NULL,
      "${props.rightColumn}" uuid NOT NULL
    )
  `);
}

async function createTestContext(): Promise<ITestContext> {
  const sql = getPostgresClient();
  const names = createTableNames();
  const tables = names.telegramTables;

  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.identity)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      provider text NOT NULL,
      account text,
      email text
    )
  `);
  await createRelationTable({
    sql,
    table: tables.subjectsToIdentities,
    leftColumn: "st_id",
    rightColumn: "iy_id",
  });
  await createRelationTable({
    sql,
    table: tables.subjectsToProfiles,
    leftColumn: "st_id",
    rightColumn: "sl_me_pe_id",
  });
  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.profile)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      variant text NOT NULL,
      slug text NOT NULL
    )
  `);
  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.chat)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      variant text NOT NULL,
      source_system_id text,
      slug text NOT NULL
    )
  `);
  await sql.unsafe(`
    CREATE TABLE ${quoteIdentifier(tables.thread)} (
      id uuid PRIMARY KEY,
      created_at timestamp NOT NULL,
      updated_at timestamp NOT NULL,
      variant text NOT NULL,
      source_system_id text,
      slug text NOT NULL
    )
  `);

  for (const relation of [
    [tables.profilesToChats, "pe_id", "ct_id"],
    [tables.chatsToThreads, "ct_id", "td_id"],
    [tables.chatsToMessages, "ct_id", "me_id"],
    [tables.chatsToActions, "ct_id", "an_id"],
    [tables.threadsToMessages, "td_id", "me_id"],
    [tables.threadsToActions, "td_id", "ac_id"],
  ] as const) {
    await createRelationTable({
      sql,
      table: relation[0],
      leftColumn: relation[1],
      rightColumn: relation[2],
    });
  }

  return { sql, ...names };
}

async function destroyTestContext(context: ITestContext) {
  for (const table of [...new Set(Object.values(context.telegramTables))]) {
    await context.sql.unsafe(`DROP TABLE IF EXISTS ${quoteIdentifier(table)}`);
  }
}

async function insertIdentityDuplicates(context: ITestContext) {
  const identity = quoteIdentifier(context.identityTables.identity);
  const links = quoteIdentifier(context.identityTables.subjectsToIdentities);

  await context.sql.unsafe(`
    INSERT INTO ${identity}
      (id, created_at, updated_at, provider, account, email)
    VALUES
      ('10000000-0000-0000-0000-000000000001', '2026-01-01', '2026-01-01', 'telegram', '550809313', NULL),
      ('10000000-0000-0000-0000-000000000002', '2026-01-02', '2026-01-02', 'telegram', '550809313', NULL)
  `);
  await context.sql.unsafe(`
    INSERT INTO ${links}
      (id, created_at, updated_at, st_id, iy_id)
    VALUES
      ('10000000-0000-0000-0000-000000000011', '2026-01-01', '2026-01-01', '10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001')
  `);
}

async function insertTelegramDuplicates(context: ITestContext) {
  const table = (key: keyof ITelegramNaturalKeyRepairTables) =>
    quoteIdentifier(context.telegramTables[key]);
  const values = {
    subject: "20000000-0000-0000-0000-000000000001",
    identity: "20000000-0000-0000-0000-000000000002",
    chatOld: "20000000-0000-0000-0000-000000000011",
    chatCanonical: "20000000-0000-0000-0000-000000000012",
    profileOld: "20000000-0000-0000-0000-000000000021",
    profileCanonical: "20000000-0000-0000-0000-000000000022",
    personalAiExpected: "20000000-0000-0000-0000-000000000023",
    personalAiStale: "20000000-0000-0000-0000-000000000024",
    defaultOld: "20000000-0000-0000-0000-000000000031",
    defaultCanonical: "20000000-0000-0000-0000-000000000032",
    topicOld: "20000000-0000-0000-0000-000000000033",
    topicCanonical: "20000000-0000-0000-0000-000000000034",
    message: "20000000-0000-0000-0000-000000000041",
    action: "20000000-0000-0000-0000-000000000042",
  };

  await context.sql.unsafe(`
    INSERT INTO ${table("identity")}
      (id, created_at, updated_at, provider, account, email)
    VALUES
      ('${values.identity}', '2026-01-01', '2026-01-01', 'telegram', '153077581', NULL)
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("subjectsToIdentities")}
      (id, created_at, updated_at, st_id, iy_id)
    VALUES
      ('20000000-0000-0000-0000-000000000003', '2026-01-01', '2026-01-01', '${values.subject}', '${values.identity}')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("chat")}
      (id, created_at, updated_at, variant, source_system_id, slug)
    VALUES
      ('${values.chatOld}', '2026-01-01', '2026-01-01', 'telegram', '153077581', 'legacy-chat'),
      ('${values.chatCanonical}', '2026-01-02', '2026-01-02', 'telegram', '153077581', 'telegram-chat-153077581')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("profile")}
      (id, created_at, updated_at, variant, slug)
    VALUES
      ('${values.profileOld}', '2026-01-01', '2026-01-01', 'telegram', 'legacy-profile'),
      ('${values.profileCanonical}', '2026-01-02', '2026-01-02', 'telegram', 'telegram-profile-${values.subject}'),
      ('${values.personalAiExpected}', '2026-01-01', '2026-01-01', 'artificial-intelligence', 'telegram-personal-ai-agent-${values.subject}'),
      ('${values.personalAiStale}', '2026-01-01', '2026-01-01', 'artificial-intelligence', 'telegram-personal-ai-agent-stale')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("subjectsToProfiles")}
      (id, created_at, updated_at, st_id, sl_me_pe_id)
    VALUES
      ('20000000-0000-0000-0000-000000000101', '2026-01-01', '2026-01-01', '${values.subject}', '${values.profileOld}'),
      ('20000000-0000-0000-0000-000000000102', '2026-01-02', '2026-01-02', '${values.subject}', '${values.profileCanonical}')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("profilesToChats")}
      (id, created_at, updated_at, variant, pe_id, ct_id)
    VALUES
      ('20000000-0000-0000-0000-000000000111', '2026-01-01', '2026-01-01', 'default', '${values.profileOld}', '${values.chatOld}'),
      ('20000000-0000-0000-0000-000000000112', '2026-01-02', '2026-01-02', 'default', '${values.profileCanonical}', '${values.chatCanonical}'),
      ('20000000-0000-0000-0000-000000000113', '2026-01-02', '2026-01-02', 'telegram-personal-ai-agent', '${values.personalAiExpected}', '${values.chatCanonical}'),
      ('20000000-0000-0000-0000-000000000114', '2026-01-02', '2026-01-02', 'telegram-personal-ai-agent', '${values.personalAiStale}', '${values.chatCanonical}')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("thread")}
      (id, created_at, updated_at, variant, source_system_id, slug)
    VALUES
      ('${values.defaultOld}', '2026-01-01', '2026-01-01', 'default', NULL, 'legacy-default'),
      ('${values.defaultCanonical}', '2026-01-02', '2026-01-02', 'default', NULL, 'telegram-thread-${values.chatCanonical}-default'),
      ('${values.topicOld}', '2026-01-01', '2026-01-01', 'telegram', '42', 'legacy-topic'),
      ('${values.topicCanonical}', '2026-01-02', '2026-01-02', 'telegram', '42', 'telegram-thread-${values.chatCanonical}-42')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("chatsToThreads")}
      (id, created_at, updated_at, variant, ct_id, td_id)
    VALUES
      ('20000000-0000-0000-0000-000000000121', '2026-01-01', '2026-01-01', 'default', '${values.chatOld}', '${values.defaultOld}'),
      ('20000000-0000-0000-0000-000000000122', '2026-01-02', '2026-01-02', 'default', '${values.chatCanonical}', '${values.defaultCanonical}'),
      ('20000000-0000-0000-0000-000000000123', '2026-01-01', '2026-01-01', 'default', '${values.chatOld}', '${values.topicOld}'),
      ('20000000-0000-0000-0000-000000000124', '2026-01-02', '2026-01-02', 'default', '${values.chatCanonical}', '${values.topicCanonical}')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("threadsToMessages")}
      (id, created_at, updated_at, td_id, me_id)
    VALUES
      ('20000000-0000-0000-0000-000000000131', '2026-01-01', '2026-01-01', '${values.topicOld}', '${values.message}')
  `);
  await context.sql.unsafe(`
    INSERT INTO ${table("threadsToActions")}
      (id, created_at, updated_at, td_id, ac_id)
    VALUES
      ('20000000-0000-0000-0000-000000000132', '2026-01-01', '2026-01-01', '${values.topicOld}', '${values.action}')
  `);
}

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

describe("Given: duplicate provider identities", () => {
  /**
   * BDD Scenario: Newest identity is retained and the active subject link follows it.
   *
   * Given: two Telegram identities share an account and only the older row is linked.
   * When: the identity repair is applied twice.
   * Then: the newest identity owns the link and the second run changes nothing.
   */
  it("Then: preserves the newest identity and converges idempotently", async () => {
    const context = await createTestContext();

    try {
      await insertIdentityDuplicates(context);

      const checked = await repairIdentityNaturalKeys({
        mode: "check",
        sql: context.sql,
        tables: context.identityTables,
      });
      expect(checked.before.identityGroups).toBe(1);
      expect(checked.diagnostics).toEqual({
        identityGroups: [
          {
            provider: "telegram",
            canonicalIdentityId: "10000000-0000-0000-0000-000000000002",
            retainedLinkId: "10000000-0000-0000-0000-000000000011",
            retainedSubjectId: "10000000-0000-0000-0000-000000000021",
            duplicateIdentityIds: ["10000000-0000-0000-0000-000000000001"],
            deletedLinkIds: [],
            detachedSubjectIds: [],
          },
        ],
        identityOwnership: [],
      });

      const applied = await repairIdentityNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.identityTables,
      });
      expect(applied.after).toEqual({
        identityGroups: 0,
        identityExtraRows: 0,
        identityLinkGroups: 0,
        identityLinkExtraRows: 0,
      });
      expect(applied.changes).toEqual({
        identityRowsDeleted: 1,
        identityLinksDeleted: 0,
        identityLinksRepointed: 1,
      });

      const [link] = await context.sql.unsafe<{ iy_id: string }[]>(`
        SELECT iy_id
        FROM ${quoteIdentifier(context.identityTables.subjectsToIdentities)}
      `);
      expect(link.iy_id).toBe("10000000-0000-0000-0000-000000000002");

      const repeated = await repairIdentityNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.identityTables,
      });
      expect(repeated.changes).toEqual({
        identityRowsDeleted: 0,
        identityLinksDeleted: 0,
        identityLinksRepointed: 0,
      });
    } finally {
      await destroyTestContext(context);
    }
  });

  /**
   * BDD Scenario: One identity is linked to multiple subjects.
   *
   * Given: one provider identity owns two subject links.
   * When: repair diagnostics and apply mode run.
   * Then: diagnostics name both relation and subject decisions before apply.
   */
  it("Then: reports and removes the older ownership link", async () => {
    const context = await createTestContext();
    const identity = quoteIdentifier(context.identityTables.identity);
    const links = quoteIdentifier(context.identityTables.subjectsToIdentities);

    try {
      await context.sql.unsafe(`
        INSERT INTO ${identity}
          (id, created_at, updated_at, provider, account, email)
        VALUES
          ('11000000-0000-0000-0000-000000000001', '2026-01-01', '2026-01-01', 'telegram', 'ownership-test', NULL)
      `);
      await context.sql.unsafe(`
        INSERT INTO ${links}
          (id, created_at, updated_at, st_id, iy_id)
        VALUES
          ('11000000-0000-0000-0000-000000000011', '2026-01-01', '2026-01-01', '11000000-0000-0000-0000-000000000021', '11000000-0000-0000-0000-000000000001'),
          ('11000000-0000-0000-0000-000000000012', '2026-01-02', '2026-01-02', '11000000-0000-0000-0000-000000000022', '11000000-0000-0000-0000-000000000001')
      `);

      const checked = await repairIdentityNaturalKeys({
        mode: "check",
        sql: context.sql,
        tables: context.identityTables,
      });
      expect(checked.diagnostics.identityOwnership).toEqual([
        {
          identityId: "11000000-0000-0000-0000-000000000001",
          retainedLinkId: "11000000-0000-0000-0000-000000000012",
          retainedSubjectId: "11000000-0000-0000-0000-000000000022",
          deletedLinkIds: ["11000000-0000-0000-0000-000000000011"],
          detachedSubjectIds: ["11000000-0000-0000-0000-000000000021"],
        },
      ]);

      const applied = await repairIdentityNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.identityTables,
      });
      expect(applied.changes).toEqual({
        identityRowsDeleted: 0,
        identityLinksDeleted: 1,
        identityLinksRepointed: 0,
      });
    } finally {
      await destroyTestContext(context);
    }
  });
});

describe("Given: duplicate Telegram chats, profiles, and threads", () => {
  /**
   * BDD Scenario: Legacy Telegram graph is normalized before constraints.
   *
   * Given: duplicate Telegram entities own different messages, actions, and links.
   * When: the deployment-time Telegram repair is applied.
   * Then: deterministic entities retain the graph, stale links are removed, and rerun is empty.
   */
  it("Then: reconnects the graph and removes every duplicate group", async () => {
    const context = await createTestContext();

    try {
      await insertTelegramDuplicates(context);

      const checked = await repairTelegramNaturalKeys({
        mode: "check",
        sql: context.sql,
        tables: context.telegramTables,
      });
      expect(checked.before.chatGroups).toBe(1);
      expect(checked.before.profileGroups).toBe(1);
      // The thread duplicates become visible only after their duplicate chats
      // are mapped to the canonical chat inside the same repair transaction.
      expect(checked.before.defaultThreadGroups).toBe(0);
      expect(checked.before.topicThreadGroups).toBe(0);
      expect(checked.before.stalePersonalAiLinks).toBe(1);

      const applied = await repairTelegramNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.telegramTables,
      });
      expect(applied.after).toEqual({
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
      });
      expect(applied.changes.chatsDeleted).toBe(1);
      expect(applied.changes.profilesDeleted).toBe(1);
      expect(applied.changes.stalePersonalAiLinksDeleted).toBe(1);

      const remainingThreads = await context.sql.unsafe<{ id: string }[]>(`
        SELECT id
        FROM ${quoteIdentifier(context.telegramTables.thread)}
        ORDER BY id
      `);
      expect(remainingThreads.map((thread) => thread.id)).toEqual([
        "20000000-0000-0000-0000-000000000032",
        "20000000-0000-0000-0000-000000000034",
      ]);
      expect(applied.changes.threadsDeleted).toBe(2);

      const [topicMessage] = await context.sql.unsafe<
        { td_id: string; me_id: string }[]
      >(`
        SELECT td_id, me_id
        FROM ${quoteIdentifier(context.telegramTables.threadsToMessages)}
      `);
      expect(topicMessage).toEqual({
        td_id: "20000000-0000-0000-0000-000000000034",
        me_id: "20000000-0000-0000-0000-000000000041",
      });

      const repeated = await repairTelegramNaturalKeys({
        mode: "apply",
        sql: context.sql,
        tables: context.telegramTables,
      });
      expect(repeated.changes).toEqual({
        chatsDeleted: 0,
        profilesDeleted: 0,
        threadsDeleted: 0,
        relationsInserted: 0,
        relationsDeleted: 0,
        stalePersonalAiLinksDeleted: 0,
      });
    } finally {
      await destroyTestContext(context);
    }
  });
});

describe("Given: a fresh database before RBAC migrations", () => {
  /**
   * BDD Scenario: Social tables exist before the RBAC ownership graph.
   *
   * Given: Social migrations ran but identity and subject relations do not exist yet.
   * When: the deployment-time Telegram repair is checked.
   * Then: it skips cleanly so the remaining fresh migrations can continue.
   */
  it("Then: skips the unavailable Telegram ownership graph", async () => {
    const context = await createTestContext();

    try {
      for (const table of [
        context.telegramTables.subjectsToProfiles,
        context.telegramTables.subjectsToIdentities,
        context.telegramTables.identity,
      ]) {
        await context.sql.unsafe(`DROP TABLE ${quoteIdentifier(table)}`);
      }

      const result = await repairTelegramNaturalKeys({
        mode: "check",
        sql: context.sql,
        tables: context.telegramTables,
      });

      expect(result.skipped).toBe(true);
      expect(result.before).toEqual({
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
      });
    } finally {
      await destroyTestContext(context);
    }
  });
});
