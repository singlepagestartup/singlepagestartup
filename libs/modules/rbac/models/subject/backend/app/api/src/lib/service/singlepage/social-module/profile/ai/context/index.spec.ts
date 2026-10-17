const persist = jest.fn();
jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: { updateMetadataNamespace: (...args: any[]) => persist(...args) },
}));
import { Service } from "./index";
import {
  aiContextPrefixHash,
  aiContextRecentStart,
  fingerprintAiContextMessage,
  hashAiContext,
} from "./utils";
import type { IAiContextHistoryMessage } from "./interface";
import { RBAC_AI_THREAD_CONTEXT_KEY } from "@sps/rbac/models/subject/sdk/model";

function fixture(
  options: {
    mode?: "full" | "compact";
    metadata?: any;
    resetMessageId?: string;
  } = {},
) {
  let metadata = structuredClone(options.metadata ?? { unrelated: "keep" });
  const originals = Array.from({ length: 11 }, (_, index) => ({
    id: `message-${index}`,
    updatedAt: "2026-10-14T00:00:00Z",
    description:
      index < 4
        ? "Historical details about the proposed business. ".repeat(350)
        : `Exact recent text ${index}: price unknown`,
  }));
  const history: IAiContextHistoryMessage[] = originals.map(
    (message, index) => ({
      id: message.id,
      role: index % 2 ? "assistant" : "user",
      content: message.description,
      attachments: [],
      fingerprint: fingerprintAiContextMessage(message, []),
    }),
  );
  const social: any = {
    thread: {
      findById: jest.fn(async () => ({
        id: "thread",
        metadata: structuredClone(metadata),
      })),
    },
    message: { find: jest.fn(async () => originals) },
    profilesToMessages: {
      find: jest.fn(async () =>
        originals
          .filter((_, index) => index % 2)
          .map((message) => ({ messageId: message.id, profileId: "profile" })),
      ),
    },
    messagesToFileStorageModuleFiles: { find: jest.fn(async () => []) },
  };
  persist.mockImplementation(async ({ namespace, expectedValue, value }) => {
    if (
      JSON.stringify(metadata[namespace] ?? null) !==
      JSON.stringify(expectedValue)
    )
      return null;
    metadata = { ...metadata, [namespace]: structuredClone(value) };
    return { id: "thread", metadata: structuredClone(metadata) };
  });
  const provider: any = {
    generate: jest.fn(async ({ context }) => {
      const input = JSON.parse(context[1].content);
      return {
        text: JSON.stringify({
          summary:
            "The price remains unknown. Assistant suggestions are unconfirmed.",
          coveredMessageIds: input.messages.map((message: any) => message.id),
        }),
        finishReason: "stop",
        billing: { totalUsd: 0.01 },
      };
    }),
  };
  const service = new Service({
    socialModule: social,
    fileStorageModule: { file: { find: jest.fn() } } as any,
    chatId: "chat",
    threadId: "thread",
    profileId: "profile",
    triggerMessageId: "message-10",
    resetMessageId: options.resetMessageId ?? null,
    history,
    documentThread: false,
    mode: options.mode ?? "compact",
  });
  const ledger: any[] = [];
  const prepare = () =>
    service.prepare({
      openRouter: provider,
      billingLedger: ledger,
      sourceRefs: [],
    });
  return {
    service,
    prepare,
    history,
    originals,
    social,
    provider,
    ledger,
    metadata: () => metadata,
  };
}

beforeEach(() => jest.clearAllMocks());

it("compresses only older history, preserves three exchanges and the trigger, and bills the summary", async () => {
  const f = fixture();
  const result = await f.prepare();
  expect(result.metrics.fallbackReason).toBeNull();
  expect(result.metrics.summarizedMessages).toBe(4);
  expect(result.messages).toEqual(
    f.history.slice(4).map(({ role, content }) => ({ role, content })),
  );
  expect(f.ledger).toMatchObject([
    { purpose: "context_summary", status: "success" },
  ]);
  expect(f.metadata().unrelated).toBe("keep");
  expect(f.service.state.prefixHash).toBe(
    aiContextPrefixHash(f.history.slice(0, 4)),
  );
});

it.each(["invalid", "missing_ids", "provider", "truncated"])(
  "retains all originals on %s summary failure",
  async (kind) => {
    const f = fixture();
    f.provider.generate.mockResolvedValue(
      kind === "provider"
        ? { error: "provider", billing: null }
        : {
            text:
              kind === "invalid"
                ? "not json"
                : JSON.stringify({
                    summary: "memory",
                    coveredMessageIds:
                      kind === "missing_ids"
                        ? []
                        : f.history.slice(0, 4).map((message) => message.id),
                  }),
            finishReason: kind === "truncated" ? "length" : "stop",
            billing: null,
          },
    );
    const result = await f.prepare();
    expect(result.messages).toEqual(
      f.history.map(({ role, content }) => ({ role, content })),
    );
    expect(result.metrics.fallbackReason).not.toBeNull();
    expect(persist).not.toHaveBeenCalled();
  },
);

it("reuses valid memory and invalidates an edited prefix", async () => {
  const f = fixture();
  await f.prepare();
  const next = fixture({ metadata: f.metadata() });
  await next.prepare();
  expect(next.provider.generate).not.toHaveBeenCalled();
  const changed = fixture({ metadata: f.metadata() });
  changed.originals[0].description = "Corrected amount: 250000 RUB";
  changed.history[0].content = changed.originals[0].description;
  changed.history[0].fingerprint = fingerprintAiContextMessage(
    changed.originals[0],
    [],
  );
  await changed.prepare();
  expect(changed.provider.generate).toHaveBeenCalledTimes(1);
  expect(
    changed.provider.generate.mock.calls[0][0].context[1].content,
  ).toContain("Corrected amount: 250000 RUB");
  expect(changed.service.state.prefixHash).not.toBe(f.service.state.prefixHash);
  expect(changed.service.state.revision).toBeGreaterThan(
    f.service.state.revision,
  );
});

it("does not publish memory when original messages changed during generation", async () => {
  const f = fixture();
  f.social.message.find.mockResolvedValue([
    { ...f.originals[0], description: "edited" },
    ...f.originals.slice(1),
  ]);
  const result = await f.prepare();
  expect(result.metrics.fallbackReason).toBe("history_changed");
  expect(persist).not.toHaveBeenCalled();
});

it("falls back after a same-profile CAS conflict without overwriting the newer state", async () => {
  const f = fixture();
  persist.mockResolvedValue(null);
  await f.prepare();
  expect(f.service.preparation.metrics.fallbackReason).toBe("state_conflict");
  expect(persist.mock.calls.length).toBeLessThanOrEqual(2);
});

it("preserves exact ordinary drafts independently of summary and rejects stale revisions", async () => {
  const f = fixture({ mode: "full" });
  await f.prepare();
  const tool = f.service
    .tools()
    .find(
      (tool) => tool.definition.function.name === "profile_thread_draft_stage",
    )!;
  const text = "# Exact draft\n\nЦена — 250 000 ₽; период не подтверждён.\n";
  await tool.execute({ title: "Draft", text, expectedHash: null });
  expect(f.service.preview()).toBe(text);
  expect(f.service.state.workingDraft?.text).toBe(text);
  expect(f.service.draftSystemMessage()[0].content).toContain(
    text.replace(/\n/g, "\\n"),
  );
  await expect(
    tool.execute({ title: "Draft", text: "stale", expectedHash: null }),
  ).rejects.toThrow("changed");
  expect(f.metadata().unrelated).toBe("keep");
});

it("rejects foreign messages and files, and supplies original images as actual model content", async () => {
  const f = fixture({ mode: "full" });
  const file: any = {
    id: "image",
    adminTitle: "reference.png",
    mimeType: "image/png",
  };
  f.history[0].attachments = [file];
  f.history[0].content = [
    { type: "text", text: "Image" },
    {
      type: "image_url",
      image_url: { url: "https://example.test/reference.png" },
    },
  ];
  await f.prepare();
  const tools = f.service.tools();
  const read = tools.find(
    (tool) => tool.definition.function.name === "profile_thread_history_read",
  )!;
  const attachment = tools.find(
    (tool) =>
      tool.definition.function.name === "profile_thread_attachment_read",
  )!;
  await expect(read.execute({ messageId: "foreign" })).rejects.toThrow(
    "outside",
  );
  await expect(attachment.execute({ fileId: "foreign" })).rejects.toThrow(
    "outside",
  );
  const result = await attachment.execute({ fileId: "image" });
  expect(attachment.additionalContext!(result)[0].content).toContainEqual({
    type: "image_url",
    image_url: { url: "https://example.test/reference.png" },
  });
});

it("pages original-history search back to its oldest matching message within the thread snapshot", async () => {
  const f = fixture({ mode: "full" });
  f.history.forEach((message, index) => {
    message.content = `Price estimate: ${index}`;
  });
  await f.prepare();
  const read = f.service
    .tools()
    .find(
      (tool) => tool.definition.function.name === "profile_thread_history_read",
    )!;
  const ids: string[] = [];
  let beforeMessageId: string | undefined;
  do {
    const result: any = await read.execute({
      query: "Price estimate",
      beforeMessageId,
    });
    expect(result.messages.length).toBeLessThanOrEqual(8);
    ids.push(...result.messages.map((message: any) => message.messageId));
    beforeMessageId = result.nextBeforeMessageId ?? undefined;
  } while (beforeMessageId);
  expect(new Set(ids).size).toBe(f.history.length);
  expect(ids).toContain("message-0");
  expect(await read.execute({ messageId: "message-0" })).toEqual(
    expect.objectContaining({ text: "Price estimate: 0" }),
  );
  await expect(read.execute({ beforeMessageId: "foreign" })).rejects.toThrow(
    "outside",
  );
});

it("reset discards conversational memory and draft without touching other metadata", async () => {
  const old = fixture({ mode: "full" });
  await old.prepare();
  await old.service.stageDraft("old", "obsolete", null);
  const reset = fixture({
    mode: "full",
    metadata: old.metadata(),
    resetMessageId: "reset",
  });
  await reset.prepare();
  expect(reset.service.state.workingDraft).toBeNull();
  expect(reset.metadata().unrelated).toBe("keep");
});

it("reports budget overflow and preserves a large exact draft", async () => {
  const f = fixture({ mode: "full" });
  await f.prepare();
  const text = "Exact large document. ".repeat(8000);
  await f.service.stageDraft("large", text, null);
  expect(f.service.measure(f.service.draftSystemMessage()).budgetExceeded).toBe(
    true,
  );
  expect(f.service.state.workingDraft!.text).toBe(text);
});

it("does not replace an unknown state version", async () => {
  const f = fixture({
    metadata: { rbacAiThreadContext: { version: 2, profiles: {} } },
  });
  expect((await f.prepare()).metrics.fallbackReason).toBe(
    "unsupported_context_state",
  );
  expect(persist).not.toHaveBeenCalled();
});
it("uses canonical hashes across JSONB key ordering", () => {
  expect(hashAiContext({ b: 2, a: { y: 2, x: 1 } })).toBe(
    hashAiContext({ a: { x: 1, y: 2 }, b: 2 }),
  );
});
it("retains consecutive user messages in the last completed exchanges", () => {
  const f = fixture();
  f.history[5].role = "user";
  expect(aiContextRecentStart(f.history, 3)).toBe(2);
});
it("invalidates a summary if attachments were removed during generation", async () => {
  const f = fixture();
  const file: any = { id: "removed", updatedAt: "2026-10-14T00:00:00Z" };
  f.history[0].attachments = [file];
  f.history[0].fingerprint = fingerprintAiContextMessage(f.originals[0], [
    file,
  ]);
  expect((await f.prepare()).metrics.fallbackReason).toBe("history_changed");
  expect(persist).not.toHaveBeenCalled();
});

it("accepts a valid summary slightly above the soft target", async () => {
  const f = fixture();
  f.provider.generate.mockImplementation(async ({ context }: any) => ({
    text: JSON.stringify({
      summary: "Unconfirmed user fact. ".repeat(240),
      coveredMessageIds: JSON.parse(context[1].content).messages.map(
        (m: any) => m.id,
      ),
    }),
    finishReason: "stop",
    billing: null,
  }));
  expect((await f.prepare()).metrics.fallbackReason).toBeNull();
  expect(f.service.state.summary).toContain("Unconfirmed user fact.");
});
it("keeps an oversized unsummarized message whole", async () => {
  const f = fixture();
  f.history[0].content = "Exact unsummarized document. ".repeat(12000);
  const result = await f.prepare();
  expect(f.provider.generate).not.toHaveBeenCalled();
  expect(result.messages[0].content).toBe(f.history[0].content);
});

it("includes instructions, JSON framing and schemas in the summary batch budget and keeps unprocessed messages", async () => {
  const f = fixture();
  for (let index = 0; index < 4; index++) {
    f.originals[index].description =
      "Historical details about the proposed business. ".repeat(900);
    f.history[index].content = f.originals[index].description;
    f.history[index].fingerprint = fingerprintAiContextMessage(
      f.originals[index],
      [],
    );
  }
  const result = await f.prepare();
  const request = f.provider.generate.mock.calls[0][0];
  const { estimateAiContextTokens } = await import("@sps/backend-utils");
  expect(
    estimateAiContextTokens(
      JSON.stringify({
        messages: request.context,
        responseFormat: request.responseFormat,
      }),
    ),
  ).toBeLessThanOrEqual(16000);
  expect(result.metrics.summarizedMessages).toBeGreaterThan(0);
  expect(result.metrics.summarizedMessages).toBeLessThan(4);
  expect(result.messages[0].content).toBe(
    f.history[result.metrics.summarizedMessages].content,
  );
});
it("rejects memory when a message author changed during generation", async () => {
  const f = fixture();
  f.social.profilesToMessages.find.mockResolvedValue([]);
  expect((await f.prepare()).metrics.fallbackReason).toBe("history_changed");
  expect(persist).not.toHaveBeenCalled();
});

it("rebuilds derived memory after a permitted Source version changes", async () => {
  const old = fixture();
  await old.prepare();
  const current = fixture({ metadata: old.metadata() });
  const result = await current.service.prepare({
    openRouter: current.provider,
    billingLedger: current.ledger,
    sourceRefs: [{ id: "source", contentHash: "new-version" }],
  });
  expect(current.provider.generate).toHaveBeenCalledTimes(1);
  expect(result.metrics.fallbackReason).toBeNull();
  expect(current.service.state.sourceRefs).toEqual([
    { id: "source", contentHash: "new-version" },
  ]);
});
