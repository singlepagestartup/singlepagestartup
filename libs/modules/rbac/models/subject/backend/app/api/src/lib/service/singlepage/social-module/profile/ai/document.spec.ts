/**
 * BDD Suite: document proposal confirmation and concurrent revisions.
 *
 * Given: a profile-scoped document with exact proposed notes and attachments.
 * When: the user confirms, rejects or revises a proposal, including stale requests.
 * Then: only confirmed notes are saved and proposal transitions preserve current state.
 */
const updateThread = jest.fn();
const attachProposalFile = jest.fn(async ({ data }: any) => data);
jest.mock(
  "@sps/social/relations/messages-to-file-storage-module-files/sdk/server",
  () => ({
    api: { findOrCreate: (...args: any[]) => attachProposalFile(...args) },
  }),
);
jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: { updateMetadataNamespace: (...args: any[]) => updateThread(...args) },
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
import { Service } from "./document";
import { getAIChatDocumentProposal } from "@sps/rbac/models/subject/sdk/model";
import {
  assembleKnowledgeContent,
  readKnowledgeMaterials,
  readKnowledgeUserContext,
} from "@sps/shared-utils";

function fixture(empty = false) {
  let thread: any = {
    id: "thread",
    title: "Brief.md",
    metadata: {
      other: "keep",
      aiChatDocument: {
        key: "brief",
        profileId: "assistant",
        sourceIds: empty ? [] : ["source"],
      },
    },
  };
  const source = {
    id: "source",
    slug: "ai-chat-document-thread",
    title: "Brief",
    content: "Original notes",
    contentHash: "old-hash",
  };
  const links: any[] = empty
    ? []
    : [{ profileId: "assistant", knowledgeModuleSourceId: "source" }];
  const origins: any[] = [];
  let sourceCreated = !empty;
  let createdSources = 0;
  updateThread.mockImplementation(
    async ({ namespace, expectedValue, value }) => {
      if (
        JSON.stringify(thread.metadata[namespace] ?? null) !==
        JSON.stringify(expectedValue)
      )
        return null;
      thread = {
        ...thread,
        metadata: { ...thread.metadata, [namespace]: value },
      };
      return structuredClone(thread);
    },
  );
  const social: any = {
    thread: { findById: jest.fn(async () => structuredClone(thread)) },
    profilesToKnowledgeModuleSources: {
      find: jest.fn(async () => links),
      findOrCreate: jest.fn(async ({ data }) => {
        const existing = links.find(
          (link) =>
            link.profileId === data.profileId &&
            link.knowledgeModuleSourceId === data.knowledgeModuleSourceId,
        );
        if (existing) return existing;
        links.push(data);
        return data;
      }),
    },
    messagesToKnowledgeModuleSources: {
      find: jest.fn(async () => origins),
      findOrCreate: jest.fn(async ({ data }) => {
        const existing = origins.find(
          (link) =>
            link.messageId === data.messageId &&
            link.knowledgeModuleSourceId === data.knowledgeModuleSourceId &&
            link.kind === data.kind,
        );
        if (existing) return existing;
        origins.push(data);
        return data;
      }),
    },
    messagesToFileStorageModuleFiles: {
      find: jest.fn(async () => []),
    },
    profilesToMessages: {
      find: jest.fn(async () => [
        { profileId: "assistant", messageId: "shown" },
      ]),
    },
  };
  const knowledge: any = {
    listSources: jest.fn(async () => [source]),
    sourceFiles: jest.fn(async () => []),
    updateSource: jest.fn(async ({ content, title }) => {
      Object.assign(source, { content, title, contentHash: "new-hash" });
      return { source };
    }),
    learnContent: jest.fn(async ({ content, title, onSourceSaved }) => {
      if (!sourceCreated) {
        Object.assign(source, { content, title });
        sourceCreated = true;
        createdSources++;
      }
      await onSourceSaved(source.id);
      return { source };
    }),
  };
  const service = new Service(social, knowledge);
  const load = () =>
    service.load({
      profileId: "assistant",
      threadId: "thread",
      message: { id: "request", metadata: {} } as any,
    });
  return {
    service,
    load,
    source,
    social,
    knowledge,
    links,
    origins,
    createdSources: () => createdSources,
    thread: () => thread,
  };
}

beforeEach(() => jest.clearAllMocks());
it("preserves proposed attachments through a text revision and adds newly supplied files", async () => {
  const f = fixture();
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([
    { fileStorageModuleFileId: "original-file" },
  ]);
  let context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "First draft",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  context = (await f.load())!;
  await f.service.resolve(context, "revise", "revision");
  expect(
    await f.service.resolve((await f.load())!, "confirm", "premature"),
  ).toMatchObject({ status: "not_confirmable" });
  // A later request still carries the original files after a failed revision.
  context = (await f.load())!;
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([
    { fileStorageModuleFileId: "added-file" },
  ]);
  await f.service.tool(context, { id: "revision" } as any).execute({
    title: "Brief",
    userContext: "Revised draft",
    expectedContentHash: "old-hash",
  });
  expect(context.proposal?.fileIds).toEqual(["original-file", "added-file"]);
  await f.service.markShown(context, "revision", "shown");
  expect(attachProposalFile).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        messageId: "shown",
        fileStorageModuleFileId: "original-file",
        orderIndex: 0,
      },
    }),
  );
  expect(attachProposalFile).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        messageId: "shown",
        fileStorageModuleFileId: "added-file",
        orderIndex: 1,
      },
    }),
  );
  await f.service.resolve((await f.load())!, "confirm", "confirmation");
  expect(f.knowledge.updateSource).toHaveBeenCalledWith(
    expect.objectContaining({ fileIds: ["original-file", "added-file"] }),
  );
});
it("proposes without saving, then applies exactly the shown text and makes repeated confirmation harmless", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Original notes\nConfirmed fact",
    expectedContentHash: "old-hash",
  });
  expect(f.knowledge.updateSource).not.toHaveBeenCalled();
  expect(f.service.preview(context, "request", "ru")).toContain(
    "Original notes\nConfirmed fact",
  );
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "confirm", "confirmation");
  expect(f.source.content).toBe("Original notes\nConfirmed fact");
  expect(f.thread().metadata.other).toBe("keep");
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "applied",
  );
  expect(
    await f.service.resolve((await f.load())!, "confirm", "repeat"),
  ).toMatchObject({ status: "already_applied" });
  expect(f.knowledge.updateSource).toHaveBeenCalledTimes(1);
});

it("requires a shown proposal, cancels revisions and detects changes since the proposal", async () => {
  const f = fixture();
  let context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Draft",
    expectedContentHash: "old-hash",
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "early"),
  ).toMatchObject({ status: "not_confirmable" });
  await f.service.markShown(context, "request", "shown");
  f.source.contentHash = "someone-else-edited";
  expect(
    await f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).toMatchObject({ status: "conflict" });
  expect(f.knowledge.updateSource).not.toHaveBeenCalled();
  context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Revised",
    expectedContentHash: f.source.contentHash,
  });
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "revise", "revise");
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "needs_revision",
  );
  expect(f.knowledge.updateSource).not.toHaveBeenCalled();
});

it("creates one first Source and binds it to the profile, origin message and document only after confirmation", async () => {
  const f = fixture(true);
  const context = (await f.load())!;
  await f.service
    .tool(context, { id: "request" } as any)
    .execute({ title: "Brief", userContext: "Initial facts" });
  expect(f.knowledge.learnContent).not.toHaveBeenCalled();
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "confirm", "confirmation");
  expect(f.links).toEqual([
    { profileId: "assistant", knowledgeModuleSourceId: "source" },
  ]);
  expect(f.thread().metadata.aiChatDocument.sourceIds).toEqual(["source"]);
  expect(
    f.social.messagesToKnowledgeModuleSources.findOrCreate,
  ).toHaveBeenCalledWith({
    data: expect.objectContaining({ messageId: "request", kind: "origin" }),
  });
  await f.service.resolve((await f.load())!, "confirm", "repeat");
  expect(f.knowledge.learnContent).toHaveBeenCalledTimes(1);
});

it("updates human notes while preserving the existing attachment material and using the read hash", async () => {
  const f = fixture();
  f.source.content = assembleKnowledgeContent(
    "Original notes",
    "Extracted PDF facts",
    "Material overview",
  );
  const originalMaterials = readKnowledgeMaterials(f.source.content);
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed human notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "confirm", "confirmation");
  expect(readKnowledgeUserContext(f.source.content)).toBe(
    "Confirmed human notes",
  );
  expect(readKnowledgeMaterials(f.source.content)).toBe(originalMaterials);
  expect(f.knowledge.updateSource).toHaveBeenCalledWith(
    expect.objectContaining({
      sourceId: "source",
      expectedContentHash: "old-hash",
    }),
  );
});

it("rejects a foreign Source selection and never saves on rejection or ordinary discussion", async () => {
  const f = fixture();
  await expect(
    f.service.load({
      profileId: "assistant",
      threadId: "thread",
      message: {
        id: "request",
        metadata: { aiChatDocumentSourceId: "foreign" },
      } as any,
    }),
  ).rejects.toThrow("does not belong");
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Draft",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "none", "discussion");
  await f.service.resolve((await f.load())!, "reject", "rejection");
  expect(f.knowledge.updateSource).not.toHaveBeenCalled();
});

it("reports saved Knowledge accurately when a later message rejects or revises the applied proposal", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  await f.service.resolve((await f.load())!, "confirm", "confirmation");

  for (const action of ["reject", "revise"] as const) {
    expect(await f.service.resolve((await f.load())!, action, action)).toEqual({
      proposalId: context.proposal!.id,
      status: "already_applied",
      sourceId: "source",
    });
  }
  expect(f.source.content).toBe("Confirmed notes");
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "applied",
  );
  expect(f.knowledge.updateSource).toHaveBeenCalledTimes(1);
});

it("does not resurrect a rejected proposal from an in-flight revision", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Proposed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  const inFlightRevision = (await f.load())!;
  await f.service.resolve((await f.load())!, "reject", "rejection");

  await expect(
    f.service.tool(inFlightRevision, { id: "revision" } as any).execute({
      title: "Brief",
      userContext: "Late revision",
      expectedContentHash: "old-hash",
    }),
  ).rejects.toThrow("changed during this request");
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "rejected",
  );
  expect(getAIChatDocumentProposal(f.thread().metadata)?.userContext).toBe(
    "Proposed notes",
  );
  expect(f.knowledge.updateSource).not.toHaveBeenCalled();
});

it.each(["reject", "revise"] as const)(
  "keeps concurrent %s from cancelling a confirmation that already started saving Knowledge",
  async (action) => {
    const f = fixture();
    const context = (await f.load())!;
    await f.service.tool(context, { id: "request" } as any).execute({
      title: "Brief",
      userContext: "Confirmed notes",
      expectedContentHash: "old-hash",
    });
    await f.service.markShown(context, "request", "shown");
    let resume!: () => void;
    let entered!: () => void;
    const saving = new Promise<void>((resolve) => (entered = resolve));
    const deferred = new Promise<void>((resolve) => (resume = resolve));
    f.knowledge.updateSource.mockImplementation(async ({ content, title }) => {
      entered();
      await deferred;
      Object.assign(f.source, { content, title, contentHash: "new-hash" });
      return { source: f.source };
    });
    const confirmation = f.service.resolve(
      (await f.load())!,
      "confirm",
      "confirmation",
    );
    const outcome = confirmation.catch((error) => error);
    await saving;
    const rejection = await f.service.resolve(
      (await f.load())!,
      action,
      "rejection",
    );
    resume();
    const result = await outcome;
    expect(rejection).toMatchObject({ status: "applying" });
    expect(result).toMatchObject({ status: "applied" });
    expect(f.source.content).toBe("Confirmed notes");
    expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
      "applied",
    );
  },
);

it("recovers after Source commit when publication of the applied Thread status fails", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  const write = updateThread.getMockImplementation()!;
  let fail = true;
  updateThread.mockImplementation(async (props) => {
    if (props.value.status === "applied" && fail) {
      fail = false;
      throw new Error("Thread temporarily unavailable");
    }
    return write(props);
  });
  await expect(
    f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).rejects.toThrow("Thread temporarily unavailable");
  expect(f.source.content).toBe("Confirmed notes");
  expect(getAIChatDocumentProposal(f.thread().metadata)).toMatchObject({
    status: "pending",
    confirmationMessageId: "confirmation",
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({ status: "applied", sourceId: "source" });
  expect(f.knowledge.updateSource).toHaveBeenCalledTimes(1);
});

it("retains a retryable claim after failure before Source commit and prevents a new proposal from replacing it", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  f.knowledge.updateSource.mockRejectedValueOnce(
    new Error("Database unavailable"),
  );
  await expect(
    f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).rejects.toThrow("Database unavailable");
  expect(f.source.content).toBe("Original notes");
  await expect(
    f.service.tool((await f.load())!, { id: "replacement" } as any).execute({
      title: "Brief",
      userContext: "Replacement",
      expectedContentHash: "old-hash",
    }),
  ).rejects.toThrow("confirmation is being applied");
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({ status: "applied" });
  expect(f.source.content).toBe("Confirmed notes");
});

it("does not infer successful attachment publication from matching notes alone", async () => {
  const f = fixture();
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([
    { fileStorageModuleFileId: "staged-file" },
  ]);
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  f.knowledge.updateSource.mockImplementationOnce(async () => {
    Object.assign(f.source, {
      title: "Brief",
      content: "Confirmed notes",
      contentHash: "unknown-commit-hash",
    });
    throw new Error("Unknown commit result");
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).toMatchObject({ status: "conflict" });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({ status: "not_confirmable" });
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "needs_revision",
  );
  f.knowledge.sourceFiles.mockResolvedValue([{ file: { id: "staged-file" } }]);
  const revised = (await f.load())!;
  await f.service.tool(revised, { id: "revision" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "unknown-commit-hash",
  });
  await f.service.markShown(revised, "revision", "shown");
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry-after-files"),
  ).toMatchObject({ status: "applied" });
  expect(f.knowledge.updateSource).toHaveBeenCalledTimes(2);
});

it("releases a permanently missing staged File for revision without changing existing notes", async () => {
  const f = fixture();
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([
    { fileStorageModuleFileId: "deleted-file" },
  ]);
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  f.knowledge.updateSource.mockRejectedValueOnce(
    Object.assign(new Error("Stored file was not found."), {
      code: "KNOWLEDGE_FILES_NOT_FOUND",
      fileIds: ["deleted-file"],
    }),
  );
  expect(
    await f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).toMatchObject({ status: "conflict", missingFileIds: ["deleted-file"] });
  expect(f.source.content).toBe("Original notes");
  expect(getAIChatDocumentProposal(f.thread().metadata)).toMatchObject({
    status: "needs_revision",
    fileIds: [],
  });
  expect(
    getAIChatDocumentProposal(f.thread().metadata)?.confirmationMessageId,
  ).toBeUndefined();
  expect(
    await f.service.resolve((await f.load())!, "revise", "revise"),
  ).toMatchObject({ status: "needs_revision" });
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([]);
  const revised = (await f.load())!;
  await f.service.tool(revised, { id: "revision" } as any).execute({
    title: "Brief",
    userContext: "Revised notes",
    expectedContentHash: "old-hash",
  });
  expect(revised.proposal?.fileIds).toEqual([]);
  await f.service.markShown(revised, "revision", "shown");
  expect(
    await f.service.resolve((await f.load())!, "confirm", "new-confirmation"),
  ).toMatchObject({ status: "applied" });
});

it("releases a claimed edit when another writer changes its original Source hash", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  f.knowledge.updateSource.mockRejectedValueOnce(
    new Error("Unknown transient failure"),
  );
  await expect(
    f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).rejects.toThrow("Unknown transient failure");
  Object.assign(f.source, {
    content: "Another writer's current notes",
    contentHash: "external-hash",
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({ status: "conflict" });
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "needs_revision",
  );
  expect(
    getAIChatDocumentProposal(f.thread().metadata)?.confirmationMessageId,
  ).toBeUndefined();
  expect(
    await f.service.resolve((await f.load())!, "reject", "reject"),
  ).toMatchObject({ status: "rejected" });
  expect(f.source.content).toBe("Another writer's current notes");
});

it("reports a partial first Source honestly when missing Files prevent completion and permits revision", async () => {
  const f = fixture(true);
  f.social.messagesToFileStorageModuleFiles.find.mockResolvedValue([
    { fileStorageModuleFileId: "deleted-file" },
  ]);
  const context = (await f.load())!;
  await f.service
    .tool(context, { id: "request" } as any)
    .execute({ title: "Brief", userContext: "Initial notes" });
  await f.service.markShown(context, "request", "shown");
  const learn = f.knowledge.learnContent.getMockImplementation();
  f.knowledge.learnContent.mockImplementationOnce(async (props) => {
    await learn(props);
    throw Object.assign(new Error("Stored file was not found."), {
      code: "KNOWLEDGE_FILES_NOT_FOUND",
      fileIds: ["deleted-file"],
    });
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).toMatchObject({
    status: "conflict",
    partialSave: true,
    sourceId: "source",
    missingFileIds: ["deleted-file"],
  });
  expect(f.source.content).toBe("Initial notes");
  expect(f.thread().metadata.aiChatDocument.sourceIds).toEqual(["source"]);
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "needs_revision",
  );
  expect(
    getAIChatDocumentProposal(f.thread().metadata)?.confirmationMessageId,
  ).toBeUndefined();
});

it("lets concurrent confirmations converge after one conditional Source write", async () => {
  const f = fixture();
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Confirmed notes",
    expectedContentHash: "old-hash",
  });
  await f.service.markShown(context, "request", "shown");
  let resume!: () => void, firstEntered!: () => void, bothEntered!: () => void;
  const firstSaving = new Promise<void>((resolve) => (firstEntered = resolve));
  const bothSaving = new Promise<void>((resolve) => (bothEntered = resolve));
  const deferred = new Promise<void>((resolve) => (resume = resolve));
  let entered = 0,
    writes = 0;
  f.knowledge.updateSource.mockImplementation(
    async ({ content, title, expectedContentHash }) => {
      entered++;
      firstEntered();
      if (entered === 2) bothEntered();
      await deferred;
      if (f.source.contentHash !== expectedContentHash)
        throw new Error("Source changed");
      writes++;
      Object.assign(f.source, { content, title, contentHash: "new-hash" });
      return { source: f.source };
    },
  );
  const first = f.service.resolve((await f.load())!, "confirm", "first");
  await firstSaving;
  const second = f.service.resolve((await f.load())!, "confirm", "second");
  await bothSaving;
  resume();
  expect(await Promise.all([first, second])).toEqual([
    expect.objectContaining({ status: "applied" }),
    expect.objectContaining({ status: "applied" }),
  ]);
  expect(writes).toBe(1);
  expect(f.thread().metadata.rbacAiDocumentProposal.confirmationMessageId).toBe(
    "first",
  );
});

it("converges concurrent first-Source confirmations through the deterministic slug and idempotent links", async () => {
  const f = fixture(true);
  const context = (await f.load())!;
  await f.service
    .tool(context, { id: "request" } as any)
    .execute({ title: "Brief", userContext: "Initial confirmed notes" });
  await f.service.markShown(context, "request", "shown");
  const learn = f.knowledge.learnContent.getMockImplementation();
  f.social.profilesToKnowledgeModuleSources.findOrCreate.mockImplementation(
    async ({ data }) => {
      if (f.links.length)
        throw new Error("23505: profile Source pair already exists");
      f.links.push(data);
      return data;
    },
  );
  f.social.messagesToKnowledgeModuleSources.findOrCreate.mockImplementation(
    async ({ data }) => {
      if (f.origins.length)
        throw new Error("23505: message Source pair already exists");
      f.origins.push(data);
      return data;
    },
  );
  let resume!: () => void, firstEntered!: () => void, bothEntered!: () => void;
  const firstSaving = new Promise<void>((resolve) => (firstEntered = resolve));
  const bothSaving = new Promise<void>((resolve) => (bothEntered = resolve));
  const deferred = new Promise<void>((resolve) => (resume = resolve));
  let entered = 0;
  f.knowledge.learnContent.mockImplementation(async (props) => {
    entered++;
    firstEntered();
    if (entered === 2) bothEntered();
    await deferred;
    return learn(props);
  });
  const first = f.service.resolve((await f.load())!, "confirm", "first");
  await firstSaving;
  const second = f.service.resolve((await f.load())!, "confirm", "second");
  await bothSaving;
  resume();
  expect(await Promise.all([first, second])).toEqual([
    expect.objectContaining({ status: "applied", sourceId: "source" }),
    expect.objectContaining({ status: "applied", sourceId: "source" }),
  ]);
  expect(f.createdSources()).toBe(1);
  expect(f.links).toHaveLength(1);
  expect(f.origins).toHaveLength(1);
  expect(f.thread().metadata.aiChatDocument.sourceIds).toEqual(["source"]);
});

it("recovers the first Source after its links commit but the applied status fails", async () => {
  const f = fixture(true);
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Initial confirmed notes",
  });
  await f.service.markShown(context, "request", "shown");
  const write = updateThread.getMockImplementation()!;
  let fail = true;
  updateThread.mockImplementation(async (props) => {
    if (props.value.status === "applied" && fail) {
      fail = false;
      throw new Error("Thread temporarily unavailable");
    }
    return write(props);
  });
  await expect(
    f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).rejects.toThrow("Thread temporarily unavailable");
  expect(f.thread().metadata.aiChatDocument.sourceIds).toEqual(["source"]);
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({ status: "applied", sourceId: "source" });
  expect(f.createdSources()).toBe(1);
  expect(f.links).toHaveLength(1);
  expect(f.origins).toHaveLength(1);
});

it("permits revision when the committed first Source changes before confirmation recovery", async () => {
  const f = fixture(true);
  const context = (await f.load())!;
  await f.service.tool(context, { id: "request" } as any).execute({
    title: "Brief",
    userContext: "Initial confirmed notes",
  });
  await f.service.markShown(context, "request", "shown");
  const write = updateThread.getMockImplementation()!;
  let fail = true;
  updateThread.mockImplementation(async (props) => {
    if (props.value.status === "applied" && fail) {
      fail = false;
      throw new Error("Thread temporarily unavailable");
    }
    return write(props);
  });
  await expect(
    f.service.resolve((await f.load())!, "confirm", "confirmation"),
  ).rejects.toThrow("Thread temporarily unavailable");
  Object.assign(f.source, {
    title: "Externally revised Brief",
    content: "Current external notes",
    contentHash: "external-hash",
  });
  expect(
    await f.service.resolve((await f.load())!, "confirm", "retry"),
  ).toMatchObject({
    status: "conflict",
    partialSave: true,
    sourceId: "source",
  });
  expect(getAIChatDocumentProposal(f.thread().metadata)?.status).toBe(
    "needs_revision",
  );
  expect(
    getAIChatDocumentProposal(f.thread().metadata)?.confirmationMessageId,
  ).toBeUndefined();
  expect(f.knowledge.learnContent).toHaveBeenCalledTimes(1);
  expect(f.source.content).toBe("Current external notes");
  const revised = (await f.load())!;
  await f.service.tool(revised, { id: "revision" } as any).execute({
    title: "Revised Brief",
    userContext: "New proposed notes",
    expectedContentHash: "external-hash",
  });
  expect(revised.proposal?.status).toBe("pending");
  expect(revised.proposal?.sourceId).toBe("source");
});
