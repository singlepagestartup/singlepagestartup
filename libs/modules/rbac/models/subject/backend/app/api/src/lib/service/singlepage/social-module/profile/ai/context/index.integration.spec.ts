import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Table as Thread } from "@sps/social/models/thread/backend/repository/database";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Repository } from "@sps/social/models/thread/backend/app/api/src/lib/repository";
import { Configuration } from "@sps/social/models/thread/backend/app/api/src/lib/configuration";
import { Service } from "./index";
import { fingerprintAiContextMessage } from "./utils";
const persist = jest.fn();
jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: { updateMetadataNamespace: (...args: any[]) => persist(...args) },
}));
afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});
it("merges two responding profiles across real JSONB CAS conflicts and rejects edited history", async () => {
  const db = getDrizzle({ Thread, Message });
  const repo = new Repository(new Configuration());
  const [thread] = await db
    .insert(Thread)
    .values({ slug: `context-${randomUUID()}`, metadata: { keep: "exact" } })
    .returning();
  const messages = await db
    .insert(Message)
    .values(
      Array.from({ length: 11 }, (_, index) => ({
        title: `test-${index}`,
        description:
          index < 4
            ? "Old business details. ".repeat(1000)
            : `Exact recent ${index}`,
      })),
    )
    .returning();
  const history = messages.map((message, index) => ({
    id: message.id,
    role: index % 2 ? ("assistant" as const) : ("user" as const),
    content: message.description!,
    attachments: [],
    fingerprint: fingerprintAiContextMessage(message, []),
  }));
  persist.mockImplementation((props) => repo.updateMetadataNamespace(props));
  const social: any = {
    thread: {
      findById: async () =>
        (await db.select().from(Thread).where(eq(Thread.id, thread.id)))[0],
    },
    message: {
      find: async () =>
        db
          .select()
          .from(Message)
          .where(
            inArray(
              Message.id,
              messages.map((m) => m.id),
            ),
          ),
    },
    messagesToFileStorageModuleFiles: { find: async () => [] },
    profilesToMessages: {
      find: async () =>
        messages
          .filter((_, index) => index % 2)
          .flatMap((message) =>
            ["first", "second"].map((profileId) => ({
              messageId: message.id,
              profileId,
            })),
          ),
    },
  };
  const create = (profileId: string) =>
    new Service({
      socialModule: social,
      fileStorageModule: { file: { find: async () => [] } } as any,
      chatId: randomUUID(),
      threadId: thread.id,
      profileId,
      triggerMessageId: messages[10].id,
      resetMessageId: null,
      history,
      documentThread: false,
      mode: "compact",
    });
  const provider: any = {
    generate: async ({ context }: any) => ({
      text: JSON.stringify({
        summary: "Current price unknown. User confirmation is required.",
        coveredMessageIds: JSON.parse(context[1].content).messages.map(
          (m: any) => m.id,
        ),
      }),
      finishReason: "stop",
      billing: null,
    }),
  };
  try {
    const first = create("first"),
      second = create("second");
    const results = await Promise.all(
      [first, second].map((service) =>
        service.prepare({
          openRouter: provider,
          billingLedger: [],
          sourceRefs: [],
        }),
      ),
    );
    expect(
      results.every((result) => result.metrics.fallbackReason === null),
    ).toBe(true);
    const [fresh] = await db
      .select()
      .from(Thread)
      .where(eq(Thread.id, thread.id));
    expect(fresh.metadata.keep).toBe("exact");
    expect(
      Object.keys((fresh.metadata.rbacAiThreadContext as any).profiles).sort(),
    ).toEqual(["first", "second"]);
    const reloaded = create("first");
    const generate = jest.fn(provider.generate);
    await reloaded.prepare({
      openRouter: { generate } as any,
      billingLedger: [],
      sourceRefs: [],
    });
    expect(generate).not.toHaveBeenCalled();
    await db
      .update(Message)
      .set({ description: "Corrected original" })
      .where(eq(Message.id, messages[0].id));
    const edited = create("first");
    const result = await edited.prepare({
      openRouter: provider,
      billingLedger: [],
      sourceRefs: [],
    });
    // The caller's snapshot still differs from the committed messages. It must not trust persisted memory.
    expect(result.metrics.fallbackReason).toBe("history_changed");
    expect(result.messages).toHaveLength(history.length);
  } finally {
    await db.delete(Message).where(
      inArray(
        Message.id,
        messages.map((m) => m.id),
      ),
    );
    await db.delete(Thread).where(eq(Thread.id, thread.id));
  }
});
