/**
 * BDD Suite: Agent-owned Telegram conversation runtime
 * Given: process-local assistant sessions keyed by chat, thread, and sender.
 * When: sessions transition, expire, restart, terminate, or receive callbacks.
 * Then: state is isolated, serialized, bounded, and protected from stale input.
 */
import { TelegramConversationMemoryStore } from "./telegram-conversation-store";
import { TelegramConversationRuntime } from "./telegram-conversation";

const key = (
  overrides: Partial<
    Record<"chatId" | "threadId" | "senderProfileId", string>
  > = {},
) => ({
  chatId: "chat-1",
  threadId: "thread-1",
  senderProfileId: "sender-1",
  ...overrides,
});

describe("TelegramConversationRuntime", () => {
  /**
   * BDD Scenario
   * Given: two senders and two topics in the same Telegram chat.
   * When: each starts a conversation.
   * Then: every chat, thread, and sender tuple owns independent state.
   */
  it("When: tuple dimensions differ Then: sessions remain isolated", async () => {
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
      { nonce: () => "nonce" },
    );
    const first = await runtime.start(key(), { selectedProfileId: "agent-a" });
    const otherSender = await runtime.start(
      key({ senderProfileId: "sender-2" }),
      {
        selectedProfileId: "agent-b",
      },
    );
    const otherThread = await runtime.start(key({ threadId: "thread-2" }), {
      selectedProfileId: "agent-c",
    });

    expect(first.selectedProfileId).toBe("agent-a");
    expect((await runtime.get(key()))?.selectedProfileId).toBe("agent-a");
    expect(otherSender.selectedProfileId).toBe("agent-b");
    expect(otherThread.selectedProfileId).toBe("agent-c");
  });

  /**
   * BDD Scenario
   * Given: two concurrent transitions for one session.
   * When: both mutate the same counter.
   * Then: the keyed lock serializes them without losing an update.
   */
  it("When: transitions overlap Then: both serialized updates are retained", async () => {
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
    );
    await runtime.start(key());

    await Promise.all(
      [20, 0].map((delay) =>
        runtime.update(key(), async (state) => {
          const value = Number(state.pagination.skills ?? 0);
          await new Promise((resolve) => setTimeout(resolve, delay));
          state.pagination.skills = value + 1;
        }),
      ),
    );

    expect((await runtime.get(key()))?.pagination.skills).toBe(2);
  });

  /**
   * BDD Scenario
   * Given: a short-lived session and an API restart represented by a new store.
   * When: time advances or a new runtime is constructed.
   * Then: transient state disappears while no persistent domain data is touched.
   */
  it("When: TTL elapses or store restarts Then: the transient session is absent", async () => {
    let now = 100;
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
      { ttlMs: 10, now: () => now },
    );
    await runtime.start(key());
    now = 111;

    expect(await runtime.get(key())).toBeUndefined();
    expect(
      await new TelegramConversationRuntime(
        new TelegramConversationMemoryStore(),
      ).get(key()),
    ).toBeUndefined();
  });

  /**
   * BDD Scenario
   * Given: an existing session and repeated termination commands.
   * When: the user re-enters and then exits twice.
   * Then: re-entry replaces the nonce and termination is idempotent.
   */
  it("When: re-entry and termination repeat Then: replacement and idempotency hold", async () => {
    let nonce = 0;
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
      { nonce: () => `nonce${++nonce}` },
    );
    const first = await runtime.start(key());
    const replacement = await runtime.start(key());

    expect(replacement.nonce).not.toBe(first.nonce);
    await expect(runtime.terminate(key())).resolves.toBe(true);
    await expect(runtime.terminate(key())).resolves.toBe(false);
  });

  /**
   * BDD Scenario
   * Given: one rendered revision of an assistant menu.
   * When: its callback is delivered twice.
   * Then: only the first callback mutates state and the second is stale.
   */
  it("When: a callback is replayed Then: its mutation executes at most once", async () => {
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
      { nonce: () => "nonce1" },
    );
    const state = await runtime.start(key());
    const callback = runtime.encodeCallback(state, "home");
    const mutation = jest.fn(async (draft) => {
      draft.page = "home";
      return "rendered";
    });

    const first = await runtime.consumeCallback(key(), callback, mutation);
    const second = await runtime.consumeCallback(key(), callback, mutation);

    expect(first.status).toBe("ok");
    expect(second.status).toBe("stale");
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: a versioned assistant callback action.
   * When: it is encoded for Telegram.
   * Then: it stays within Telegram's 64-byte limit and round-trips.
   */
  it("When: callback data is encoded Then: it is compact and decodable", async () => {
    const runtime = new TelegramConversationRuntime(
      new TelegramConversationMemoryStore(),
      { nonce: () => "nonce1" },
    );
    const state = await runtime.start(key());
    const encoded = runtime.encodeCallback(state, "skill_link", "abc123");

    expect(encoded.length).toBeLessThanOrEqual(64);
    expect(runtime.decodeCallback(encoded)).toEqual({
      nonce: "nonce1",
      revision: 0,
      action: "skill_link",
      token: "abc123",
    });
  });
});
