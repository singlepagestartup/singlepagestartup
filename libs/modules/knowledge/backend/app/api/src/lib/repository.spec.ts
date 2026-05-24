/**
 * BDD Suite: knowledge vector repository contract.
 *
 * Given: pgvector search must use cosine ordering.
 * When: the repository implementation is inspected.
 * Then: the query keeps the raw pgvector operator in ORDER BY.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
});
