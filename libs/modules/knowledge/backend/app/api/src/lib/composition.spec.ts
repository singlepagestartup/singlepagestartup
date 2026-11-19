import { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { Service as ChunkService } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/service";
import { Service as LinkService } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/service";
import { Service as AttachmentService } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as FileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { serviceBootstrap as fileOwner } from "@sps/file-storage/models/file/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as sourceOwner } from "@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as chunkOwner } from "@sps/knowledge/models/chunk/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as linkOwner } from "@sps/knowledge/relations/sources-to-chunks/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attachmentOwner } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as templateOwner } from "@sps/notification/models/template/backend/app/api/src/lib/bootstrap";
import { Service as TemplateService } from "@sps/notification/models/template/backend/app/api/src/lib/service";
import { createAppAssembly } from "@sps/shared-backend-api";
import { createKnowledgeServices } from "./composition";
import { moduleBootstrap } from "./bootstrap";
import { KnowledgeIndexer } from "./indexer";

it("uses the module assembly's Source and Chunk on the status HTTP route", async () => {
  const source = new SourceService({} as never);
  const chunk = new ChunkService({} as never);
  jest.spyOn(source, "count").mockResolvedValue(2);
  jest.spyOn(chunk, "count").mockResolvedValue(7);
  const assembly = createAppAssembly(({ overrideService }) => {
    overrideService(sourceOwner, source);
    overrideService(chunkOwner, chunk);
  });
  await expect(
    sourceOwner.createService(assembly).getStatus(),
  ).resolves.toEqual({
    sources: 2,
    chunks: 7,
  });

  const { app } = await moduleBootstrap.bootstrap(assembly);
  const { app: sourceApp } = await sourceOwner.bootstrap(assembly);
  expect(app.apps.apps.find(({ route }) => route === "/sources")?.app).toBe(
    sourceApp,
  );
  const response = await app.hono.request("/status");
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    data: { sources: 2, chunks: 7 },
  });
});

it("resolves each explicit graph's File without rebinding its existing services", () => {
  const chunk = new ChunkService({} as never);
  const firstFile = new FileService({} as never);
  const secondFile = new FileService({} as never);
  const first = createKnowledgeServices({
    chunk,
    fileStorageFile: firstFile,
  });
  const second = createKnowledgeServices({
    chunk,
    fileStorageFile: secondFile,
  });
  expect(first.chunk).toBe(chunk);
  expect(second.chunk).not.toBe(chunk);
  expect(first.chunk.modules.fileStorage.file).toBe(firstFile);
  expect(second.chunk.modules.fileStorage.file).toBe(secondFile);
});

it("resolves the attachment relation before acquiring its scoped Source command", async () => {
  const source = new SourceService({} as never);
  const record = { id: "attachment", sourceId: "source" };
  const mutate = jest.spyOn(source, "mutateFileRelation").mockResolvedValue({
    relation: record,
  } as Awaited<ReturnType<SourceService["mutateFileRelation"]>>);
  const createSource = jest.fn(() => source);
  const assembly = createAppAssembly(({ overrideServiceWith }) =>
    overrideServiceWith(sourceOwner, createSource),
  );

  const relation = attachmentOwner.createService(assembly);
  expect(createSource).not.toHaveBeenCalled();
  await expect(
    relation.create({ data: { sourceId: "source" } }),
  ).resolves.toEqual(record);
  expect(createSource).toHaveBeenCalledTimes(1);
  expect(mutate).toHaveBeenCalledWith({
    action: "create",
    data: { sourceId: "source" },
  });
});

function sourceFixture() {
  const fresh = {
    id: "allowed",
    title: "Allowed",
    contentHash: "v1",
    indexedContentHash: "v1",
  };
  const stale = {
    id: "stale",
    title: "Stale",
    contentHash: "v2",
    indexedContentHash: "v1",
  };
  const find = jest.fn(async () => [fresh, stale]);
  const freshHeaders = jest.fn(async () => [fresh]);
  const source = new SourceService({ find, freshHeaders } as any);
  const chunk = Object.assign(new ChunkService({} as never), {
    search: jest.fn(async () => [
      {
        id: "chunk",
        text: "Saved",
        metadata: {},
        chunkIndex: 0,
        distance: 0,
        similarity: 1,
      },
    ]),
  });
  const sourcesToChunks = Object.assign(new LinkService({} as never), {
    forSources: jest.fn(async () => [{ sourceId: fresh.id, chunkId: "chunk" }]),
  });
  const sourcesToFileStorageModuleFiles = Object.assign(
    new AttachmentService({} as never),
    {
      sourceFiles: jest.fn(async () => ["effective relation result"]),
    },
  );
  const assembly = createAppAssembly(({ overrideService }) => {
    overrideService(chunkOwner, chunk);
    overrideService(linkOwner, sourcesToChunks);
    overrideService(attachmentOwner, sourcesToFileStorageModuleFiles);
  });
  source.withAppAssembly(assembly).configure({
    inTransaction: true,
    readSnapshot: (operation) => operation(source),
    transaction: (operation) => operation(source),
    afterCommit: jest.fn(),
    process: jest.fn(),
  });
  return {
    source,
    find,
    freshHeaders,
    chunk,
    sourcesToChunks,
    sourcesToFileStorageModuleFiles,
    fresh,
    stale,
  };
}
it("returns no chunks for an explicit empty Source scope without repository access", async () => {
  const f = sourceFixture();
  expect(
    await f.source.searchChunks({ embedding: [], topK: 5, sourceIds: [] }),
  ).toEqual([]);
  expect(f.find).not.toHaveBeenCalled();
  expect(f.chunk.search).not.toHaveBeenCalled();
});
it("passes only fresh scoped chunk IDs to the owning vector service", async () => {
  const f = sourceFixture();
  expect(
    await f.source.searchChunks({
      embedding: [1],
      topK: 5,
      sourceIds: ["allowed", "stale"],
    }),
  ).toEqual([
    expect.objectContaining({
      sourceId: "allowed",
      sourceTitle: "Allowed",
      text: "Saved",
    }),
  ]);
  expect(f.sourcesToChunks.forSources).toHaveBeenCalledWith(["allowed"]);
  expect(f.chunk.search).toHaveBeenCalledWith(
    expect.objectContaining({ ids: ["chunk"], embedding: [1] }),
  );
  expect(f.freshHeaders).toHaveBeenCalledWith(["allowed", "stale"]);
  expect(f.find).not.toHaveBeenCalled();
});
it("reads scoped retrieval inside the shared snapshot capability", async () => {
  const f = sourceFixture();
  const readSnapshot = jest.fn(async (operation) => operation(f.source));
  const caller = new SourceService({} as any);
  caller.configure({ inTransaction: false, readSnapshot } as any);
  expect(
    await caller.searchChunks({
      embedding: [],
      topK: 5,
      sourceIds: ["allowed"],
    }),
  ).toEqual([expect.objectContaining({ sourceId: "allowed" })]);
  expect(readSnapshot).toHaveBeenCalledTimes(1);
});

it("resolves the transaction File and the parent override through a Chunk startup method", async () => {
  const transaction = { id: "snapshot" };
  const source = new SourceService({
    readSnapshot: async (operation: (tx: unknown) => Promise<unknown>) =>
      operation(transaction),
    freshHeaders: async () => [{ id: "source", title: "Document" }],
  } as never);
  const file = new FileService({} as never);
  const chunk = new ChunkService({} as never);
  const links = new LinkService({} as never);
  const template = new TemplateService({} as never);
  const assembly = createAppAssembly(({ overrideService }) =>
    overrideService(templateOwner, template),
  );
  jest
    .spyOn(links, "forSources")
    .mockResolvedValue([{ sourceId: "source", chunkId: "chunk" }] as Awaited<
      ReturnType<typeof links.forSources>
    >);
  const search = jest.spyOn(chunk, "search").mockImplementation(async function (
    this: ChunkService,
  ) {
    expect(this.modules.fileStorage.file).not.toBe(file);
    expect(this.modules.fileStorage.file.repository).toMatchObject({
      db: transaction,
    });
    expect(this.modules.notification.template).toBe(template);
    expect(this.modules.notification.template.repository).not.toHaveProperty(
      "db",
    );
    return [];
  });
  createKnowledgeServices({
    assembly,
    source,
    chunk,
    fileStorageFile: file,
    sourcesToChunks: links,
    processing: false,
  });

  await expect(
    source.searchChunks({ embedding: [1], topK: 1, sourceIds: ["source"] }),
  ).resolves.toEqual([]);
  expect(search).toHaveBeenCalledTimes(1);
  expect(file.repository).not.toHaveProperty("db");
});
it("traverses the effective relation service for files instead of accessing its repository", async () => {
  const f = sourceFixture();
  expect(await f.source.sourceFiles("allowed")).toEqual([
    "effective relation result",
  ]);
  expect(f.sourcesToFileStorageModuleFiles.sourceFiles).toHaveBeenCalledWith(
    "allowed",
  );
  expect(f.find).not.toHaveBeenCalled();
});
it("preserves effective child overrides in transaction scopes and commits without changing singleton repositories", async () => {
  const calls: string[] = [];
  const tx = { transactionId: "operation" };
  const repository: any = {
    transaction: async (operation: (scope: unknown) => Promise<unknown>) => {
      const result = await operation(tx);
      calls.push("commit");
      return result;
    },
    lockSlug: jest.fn(async function (this: any) {
      expect(this.db).toBe(tx);
      calls.push("source lock");
    }),
    find: jest.fn(async () => []),
    insert: jest.fn(async function (this: any, data: any) {
      expect(this.db).toBe(tx);
      return { id: "source", ...data };
    }),
  };
  const source = new SourceService(repository);
  const graph = createKnowledgeServices({
    source,
    processing: false,
  });
  const saved = await graph.source.upsertSourceBySlug(
    { slug: "test", title: "Test", content: "Notes" },
    true,
  );
  expect(saved.id).toBe("source");
  expect(calls).toEqual(["source lock", "commit"]);
  expect(repository.db).toBeUndefined();
});

it("commits without application-level publisher wiring", async () => {
  const transaction = jest.fn(async (operation) => operation({}));
  const source = new SourceService({
    transaction,
    lockSlug: async () => {},
    find: async () => [],
    insert: async (data: any) => ({ id: "source", ...data }),
  } as any);
  const graph = createKnowledgeServices({ source, processing: false });
  expect(
    (
      await graph.source.upsertSourceBySlug({
        slug: "capture",
        title: "Capture",
        content: "Notes",
      })
    ).id,
  ).toBe("source");
  expect(transaction).toHaveBeenCalledTimes(1);
});

it("processes a saved Source once after commit and skips processing on rollback", async () => {
  const events: string[] = [];
  let rollBack = false;
  const record = {
    id: "source",
    title: "Document",
    content: "Body",
  };
  const source = new SourceService({
    transaction: async (operation: (tx: unknown) => Promise<unknown>) => {
      const result = await operation({});
      if (rollBack) {
        events.push("rollback");
        throw new Error("commit failed");
      }
      events.push("commit");
      return result;
    },
    insert: async () => record,
    findFirstByField: async () => record,
  } as never);
  const index = jest
    .spyOn(KnowledgeIndexer.prototype, "index")
    .mockImplementation(async () => {
      events.push("index");
      return {} as Awaited<ReturnType<KnowledgeIndexer["index"]>>;
    });
  try {
    createKnowledgeServices({ source });
    await expect(source.create({ data: record })).resolves.toEqual(record);
    expect(events).toEqual(["commit", "index"]);

    rollBack = true;
    await expect(source.create({ data: record })).rejects.toThrow(
      "commit failed",
    );
    expect(events).toEqual(["commit", "index", "rollback"]);
    expect(index).toHaveBeenCalledTimes(1);
  } finally {
    index.mockRestore();
  }
});

it("expands global vector candidates past stale results without reading every Source or restricting the global HNSW query", async () => {
  const f = sourceFixture();
  const chunks = Array.from({ length: 100 }, (_, index) => ({
    id: "chunk-" + index,
    text: "Text",
    metadata: {},
    chunkIndex: index,
    distance: index / 100,
    similarity: 1 - index / 100,
  }));
  f.chunk.search.mockImplementation(async (props: any) =>
    chunks.slice(0, props.topK),
  );
  (f.chunk as any).count = jest.fn(async () => 100);
  (f.sourcesToChunks as any).forChunkIds = jest.fn(async (ids: string[]) =>
    ids.map((id) => ({
      sourceId: id === "chunk-90" ? "allowed" : "stale",
      chunkId: id,
    })),
  );
  expect(await f.source.searchChunks({ embedding: [1], topK: 1 })).toEqual([
    expect.objectContaining({ id: "chunk-90", sourceId: "allowed" }),
  ]);
  expect(f.chunk.search.mock.calls).toEqual([
    [{ embedding: [1], minSimilarity: undefined, topK: 64 }],
    [{ embedding: [1], minSimilarity: undefined, topK: 100 }],
  ]);
  expect(f.find).not.toHaveBeenCalled();
  expect(f.sourcesToChunks.forSources).not.toHaveBeenCalled();
});

it("retains an imported File when Source association fails", async () => {
  const events: string[] = [];
  const source = new SourceService({} as any);
  const attachment = new AttachmentService({} as never);
  const file = new FileService({} as never);
  jest.spyOn(attachment, "sourceFiles").mockResolvedValue([]);
  jest.spyOn(file, "importPath").mockImplementation(async () => {
    events.push("create File");
    return { id: "new-file" } as Awaited<ReturnType<FileService["importPath"]>>;
  });
  const assembly = createAppAssembly(({ overrideService }) => {
    overrideService(attachmentOwner, attachment);
    overrideService(fileOwner, file);
  });
  source.withAppAssembly(assembly);
  source.attachFiles = jest.fn(async () => {
    events.push("attach");
    throw new Error("link refused");
  });
  await expect(
    source.ensureFileForSource({ sourceId: "source", filePath: "fixture.txt" }),
  ).rejects.toThrow("link refused");
  expect(events).toEqual(["create File", "attach"]);
});
