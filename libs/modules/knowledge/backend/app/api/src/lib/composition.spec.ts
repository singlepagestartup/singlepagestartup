import { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { createKnowledgeServices } from "./composition";

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
  const chunk = {
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
  };
  const sourcesToChunks = {
    forSources: jest.fn(async () => [{ sourceId: fresh.id, chunkId: "chunk" }]),
  };
  const sourcesToFileStorageModuleFiles = {
    sourceFiles: jest.fn(async () => ["effective relation result"]),
  };
  source.configure({
    chunk,
    sourcesToChunks,
    sourcesToFileStorageModuleFiles,
    inTransaction: true,
  } as any);
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
  source.configure({
    sourcesToFileStorageModuleFiles: { sourceFiles: async () => [] },
    fileStorageFile: {
      importPath: async () => {
        events.push("create File");
        return { id: "new-file" };
      },
    },
  } as any);
  source.attachFiles = jest.fn(async () => {
    events.push("attach");
    throw new Error("link refused");
  });
  await expect(
    source.ensureFileForSource({ sourceId: "source", filePath: "fixture.txt" }),
  ).rejects.toThrow("link refused");
  expect(events).toEqual(["create File", "attach"]);
});
