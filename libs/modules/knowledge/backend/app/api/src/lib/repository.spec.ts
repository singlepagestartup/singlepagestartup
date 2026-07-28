/**
 * BDD Suite: knowledge vector repository contract.
 *
 * Given: pgvector search must use cosine ordering.
 * When: the repository implementation is inspected.
 * Then: the query keeps the raw pgvector operator in ORDER BY.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDrizzle } from "@sps/shared-backend-database-config";
import { KnowledgeRepository } from "./repository";

jest.mock("@sps/shared-backend-database-config", () => {
  return {
    getDrizzle: jest.fn(),
  };
});

describe("knowledge vector repository contract", () => {
  /**
   * BDD Scenario: pgvector ordering.
   *
   * Given: vector similarity search is implemented with SQL.
   * When: the repository source is read.
   * Then: it orders by the `<=>` cosine-distance operator for index usage.
   */
  it("orders vector search by cosine distance", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      ),
      "utf-8",
    );

    expect(source).toContain("ORDER BY c.embedding <=>");
  });

  /**
   * BDD Scenario: profile-scoped exact vector search.
   *
   * Given: HNSW can choose global candidates before a document filter is applied.
   * When: search is restricted to profile-linked document ids.
   * Then: allowed chunks are materialized before exact distance ordering.
   */
  it("materializes document-filtered chunks before ordering", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      ),
      "utf-8",
    );

    expect(source).toContain("filtered_chunks AS MATERIALIZED");
    expect(source).toContain("INNER JOIN sps_ke_source s");
    expect(source).toContain("FROM filtered_chunks");
    expect(source).toContain("ORDER BY distance");
  });

  /**
   * BDD Scenario: source relation join.
   *
   * Given: chunk ownership moved to an SPS relation table.
   * When: the repository source is read.
   * Then: search joins sources through the Source->Chunk relation and no longer reads c.source_id.
   */
  it("joins sources through the source chunk relation", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      ),
      "utf-8",
    );

    expect(source).toContain("LEFT JOIN sps_ke_ss_to_cs_rae sc");
    expect(source).toContain('sc.se_id AS "sourceId"');
    expect(source).not.toContain("c.source_id");
  });

  /**
   * BDD Scenario: neighbor chunks.
   *
   * Given: RAG retrieval uses parent context from adjacent chunks.
   * When: the repository source is read.
   * Then: neighbors are selected by the same source relation and chunk index window.
   */
  it("loads neighbor chunks by source relation and chunk index window", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      ),
      "utf-8",
    );

    expect(source).toContain("async findNeighborChunks");
    expect(source).toContain("WITH seed_values");
    expect(source).toContain(
      "INNER JOIN sps_ke_ss_to_cs_rae sc ON sc.se_id = seed_values.source_id",
    );
    expect(source).toContain("WHERE c.chunk_index BETWEEN");
    expect(source).toContain('retrievalRole: "neighbor"');
  });

  /**
   * BDD Scenario: generic document upsert payload normalization.
   *
   * Given: a caller-provided learn request contains Date values from upstream data.
   * When: the repository upserts a generic Knowledge document by slug.
   * Then: document payload and metadata are serialized before insert.
   */
  it("normalizes learned document values before document upsert", async () => {
    const execute = jest.fn().mockResolvedValueOnce([
      {
        id: "document-1",
        slug: "knowledge-profile-message-file-hash",
        title: "2026-01-03T00:00:00.000Z",
      },
    ]);
    const db = {
      execute,
    };

    jest.mocked(getDrizzle).mockReturnValue(db as any);

    const repository = new KnowledgeRepository();
    const result = await repository.upsertDocumentBySlug({
      slug: "knowledge-profile-message-file-hash",
      title: new Date("2026-01-04T00:00:00.000Z") as any,
      description: new Date("2026-01-05T00:00:00.000Z") as any,
      summary: new Date("2026-01-06T00:00:00.000Z") as any,
      status: "imported",
      metadata: {
        uploadedAt: new Date("2026-01-07T00:00:00.000Z"),
      },
    });
    const documentQuery = execute.mock.calls[0][0];
    const documentQueryValues = collectValues(documentQuery);
    const documentQueryText = JSON.stringify(documentQueryValues);

    expect(result.id).toBe("document-1");
    expect(documentQueryText).toContain("knowledge-profile-message-file-hash");
    expect(documentQueryText).toContain("uploadedAt");
    expect(documentQueryText).toContain("2026-01-07T00:00:00.000Z");
    expect(documentQueryValues.some((value) => value instanceof Date)).toBe(
      false,
    );
  });

  /**
   * BDD Scenario: one-way module boundary.
   *
   * Given: Knowledge is a generic lower-level RAG module.
   * When: Knowledge runtime source is inspected.
   * Then: it has no Social imports, Social tables, or chat-message endpoint.
   */
  it("does not access Social runtime code or tables", () => {
    const runtimeFiles = [
      "libs/modules/knowledge/backend/app/api/src/lib/app.ts",
      "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      "libs/modules/knowledge/backend/app/api/src/lib/service.ts",
    ].map((filePath) => {
      return readFileSync(resolve(process.cwd(), filePath), "utf-8");
    });
    const runtimeSource = runtimeFiles.join("\n");

    expect(runtimeSource).not.toContain("@sps/social");
    expect(runtimeSource).not.toContain("sl_profile");
    expect(runtimeSource).not.toContain("sl_ps_to_ke");
    expect(runtimeSource).not.toContain("sl_chat");
    expect(runtimeSource).not.toContain("sl_thread");
    expect(runtimeSource).not.toContain("sl_message");
    expect(runtimeSource).not.toContain("/chat/messages");
  });

  /**
   * BDD Scenario: document status after indexing.
   *
   * Given: a Knowledge document was successfully embedded and chunked.
   * When: the repository writes document index metadata.
   * Then: the document status is updated to `indexed`.
   */
  it("marks a document as indexed when index metadata is written", async () => {
    const execute = jest.fn().mockResolvedValueOnce([
      {
        id: "document-1",
        status: "indexed",
        contentHash: "content-hash",
      },
    ]);
    const returning = jest.fn().mockReturnValue({ execute });
    const where = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where });
    const update = jest.fn().mockReturnValue({ set });
    const db = {
      update,
    };

    jest.mocked(getDrizzle).mockReturnValue(db as any);

    const repository = new KnowledgeRepository();
    await repository.updateDocumentIndexMetadata({
      documentId: "document-1",
      contentHash: "content-hash",
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "indexed",
        contentHash: "content-hash",
      }),
    );
  });

  /**
   * BDD Scenario: hard-delete cleanup.
   *
   * Given: a Knowledge document has indexed sources, chunks, files, and edit suggestions.
   * When: the repository implementation is inspected.
   * Then: document deletion cleans Knowledge-owned derived rows instead of reindexing.
   */
  it("cleans document-derived vectors and suggestions during hard delete", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "libs/modules/knowledge/backend/app/api/src/lib/repository.ts",
      ),
      "utf-8",
    );

    expect(source).toContain("deleteDocumentWithDerivedData");
    expect(source).toContain("deleteSourceFilesBySourceIds");
    expect(source).toContain("deleteSourceChunkRelationsBySourceIds");
    expect(source).toContain("deleteOrphanChunks");
    expect(source).toContain("deleteSourcesByIds");
    expect(source).toContain("EditSuggestionTable");
    expect(source).toContain("DocumentTable");
    expect(source).toContain("metadata}->>'documentId'");
    expect(source).not.toContain(
      "deleteDocumentWithDerivedData(documentId) {\n    await this.index",
    );
  });
});

function collectValues(value: unknown, seen = new Set<unknown>()): unknown[] {
  if (value === null || value === undefined) {
    return [value];
  }

  if (typeof value !== "object") {
    return [value];
  }

  if (seen.has(value)) {
    return [];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectValues(entry, seen));
  }

  return Object.values(value).flatMap((entry) => collectValues(entry, seen));
}
