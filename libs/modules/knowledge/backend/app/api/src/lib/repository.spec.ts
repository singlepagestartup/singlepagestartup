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
    expect(source).not.toContain("c.source_id");
  });

  /**
   * BDD Scenario: chat learn upsert payload normalization.
   *
   * Given: a file-backed /learn request contains Date values from upstream data.
   * When: the repository creates the deterministic Knowledge document.
   * Then: hash, slug, document payload, and metadata are normalized before insert.
   */
  it("normalizes file-backed chat learn values before document upsert", async () => {
    const execute = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "document-1",
          slug: "social-chat-learn-profile-message-file-hash",
          title: "2026-01-03T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "profile-document-relation-1" }]);
    const db = {
      execute,
    };

    jest.mocked(getDrizzle).mockReturnValue(db as any);

    const repository = new KnowledgeRepository();
    const result = await repository.upsertChatLearnDocumentForProfile({
      profileId: "profile-1",
      chatId: "chat-1",
      threadId: "thread-1",
      messageId: "message-1",
      fileId: new Date("2026-01-01T00:00:00.000Z") as any,
      fileName: new Date("2026-01-02T00:00:00.000Z") as any,
      filePath: new Date("2026-01-03T00:00:00.000Z") as any,
      title: new Date("2026-01-04T00:00:00.000Z") as any,
      content: new Date("2026-01-05T00:00:00.000Z") as any,
      metadata: {
        uploadedAt: new Date("2026-01-06T00:00:00.000Z"),
      },
    });
    const documentQuery = execute.mock.calls[0][0];
    const documentQueryValues = collectValues(documentQuery);
    const documentQueryText = JSON.stringify(documentQueryValues);

    expect(result.id).toBe("document-1");
    expect(documentQueryText).toContain("2026-01-05T00:00:00.000Z");
    expect(documentQueryText).toContain(
      "social-chat-learn-profile-1-message-1",
    );
    expect(documentQueryText).toContain("fileId");
    expect(documentQueryText).toContain("2026-01-01T00:00:00.000Z");
    expect(documentQueryText).toContain("fileName");
    expect(documentQueryText).toContain("2026-01-02T00:00:00.000Z");
    expect(documentQueryText).toContain("filePath");
    expect(documentQueryText).toContain("2026-01-03T00:00:00.000Z");
    expect(documentQueryText).toContain("uploadedAt");
    expect(documentQueryText).toContain("2026-01-06T00:00:00.000Z");
    expect(documentQueryValues.some((value) => value instanceof Date)).toBe(
      false,
    );
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
