import { getDrizzle } from "@sps/shared-backend-database-config";
import { PgDialect } from "drizzle-orm/pg-core";
import { KnowledgeRepository } from "./repository";

jest.mock("@sps/shared-backend-database-config", () => ({
  getDrizzle: jest.fn(),
}));

describe("Knowledge search scope", () => {
  it("returns no chunks for an explicitly empty scope without querying the database", async () => {
    const execute = jest.fn();
    jest.mocked(getDrizzle).mockReturnValue({ execute } as any);
    const repository = new KnowledgeRepository();
    expect(
      await repository.searchChunks({
        embedding: Array(768).fill(0),
        topK: 5,
        sourceIds: [],
      }),
    ).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("binds source identifiers and requires a current published hash", async () => {
    const execute = jest.fn().mockResolvedValue([]);
    jest.mocked(getDrizzle).mockReturnValue({ execute } as any);
    const repository = new KnowledgeRepository();
    await repository.searchChunks({
      embedding: Array(768).fill(0),
      topK: 5,
      sourceIds: ["8c7d8438-ec7f-47de-9fb1-294b56eca34a"],
    });
    const query = new PgDialect().sqlToQuery(execute.mock.calls[0][0]);
    expect(query.params).toContain("8c7d8438-ec7f-47de-9fb1-294b56eca34a");
    expect(query.sql).toContain("s.indexed_content_hash = s.content_hash");
    expect(query.sql).not.toContain("metadata->>");
  });
});
