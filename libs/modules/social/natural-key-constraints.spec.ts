/**
 * BDD Suite: Social repository natural-key constraints.
 *
 * Given: startup repository schemas compose the singlepage constraints.
 * When: their Drizzle table metadata is inspected.
 * Then: Telegram and relation natural keys remain uniquely constrained.
 */

import { getTableConfig } from "drizzle-orm/pg-core";
import { Table as ChatTable } from "@sps/social/models/chat/backend/repository/database";
import { Table as ChatsToActionsTable } from "@sps/social/relations/chats-to-actions/backend/repository/database";
import { Table as ChatsToMessagesTable } from "@sps/social/relations/chats-to-messages/backend/repository/database";
import { Table as ChatsToThreadsTable } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { Table as ProfilesToChatsTable } from "@sps/social/relations/profiles-to-chats/backend/repository/database";
import { Table as ThreadsToActionsTable } from "@sps/social/relations/threads-to-actions/backend/repository/database";
import { Table as ThreadsToMessagesTable } from "@sps/social/relations/threads-to-messages/backend/repository/database";

interface IExpectedIndex {
  name: string;
  columns: readonly string[];
}

function expectUniqueIndex(
  table: Parameters<typeof getTableConfig>[0],
  expected: IExpectedIndex,
) {
  const index = getTableConfig(table).indexes.find(
    (item) => item.config.name === expected.name,
  );

  expect(index).toBeDefined();
  expect(index?.config.unique).toBe(true);
  expect(
    index?.config.columns.map((column) =>
      "name" in column ? column.name : undefined,
    ),
  ).toEqual(expected.columns);
}

describe("Given: startup Social repository schemas", () => {
  /**
   * BDD Scenario: Telegram chat natural key.
   *
   * Given: a Telegram chat is identified by its external Telegram id.
   * When: the final chat table is built.
   * Then: one Telegram chat exists per source system id.
   */
  it("When: chat constraints are composed Then: keeps the Telegram source id unique", () => {
    expectUniqueIndex(ChatTable, {
      name: "sl_chat_telegram_source_system_unique",
      columns: ["source_system_id"],
    });
  });

  /**
   * BDD Scenario: Social graph relation natural keys.
   *
   * Given: graph links may be ensured repeatedly by independent requests.
   * When: the final relation tables are built.
   * Then: each semantic pair remains unique.
   */
  it("When: relation constraints are composed Then: keeps one row per pair", () => {
    for (const [table, expected] of [
      [
        ProfilesToChatsTable,
        { name: "sl_profile_chat_unique", columns: ["pe_id", "ct_id"] },
      ],
      [
        ChatsToThreadsTable,
        { name: "sl_chat_thread_unique", columns: ["ct_id", "td_id"] },
      ],
      [
        ChatsToMessagesTable,
        { name: "sl_chat_message_unique", columns: ["ct_id", "me_id"] },
      ],
      [
        ChatsToActionsTable,
        { name: "sl_chat_action_unique", columns: ["ct_id", "an_id"] },
      ],
      [
        ThreadsToMessagesTable,
        { name: "sl_thread_message_unique", columns: ["td_id", "me_id"] },
      ],
      [
        ThreadsToActionsTable,
        { name: "sl_thread_action_unique", columns: ["td_id", "ac_id"] },
      ],
    ] as const) {
      expectUniqueIndex(table, expected);
    }
  });

  /**
   * BDD Scenario: one default thread per chat.
   *
   * Given: the default Telegram flow has no topic id.
   * When: the final chat-thread relation is built.
   * Then: only one default relation is permitted for a chat.
   */
  it("When: chat-thread constraints are composed Then: keeps one default thread per chat", () => {
    expectUniqueIndex(ChatsToThreadsTable, {
      name: "sl_chat_default_thread_unique",
      columns: ["ct_id"],
    });
  });
});
