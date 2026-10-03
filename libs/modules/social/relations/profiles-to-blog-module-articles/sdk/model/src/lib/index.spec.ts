import { getTableConfig } from "drizzle-orm/pg-core";
import { Table } from "@sps/social/relations/profiles-to-blog-module-articles/backend/repository/database";
import { insertSchema, route } from "./index";

describe("profile article relation schema", () => {
  const profileId = "f7dbba43-06b2-4d76-ae41-7a114313a042";
  const blogModuleArticleId = "008edc3b-2962-45ae-b51a-7ac79ef18c41";

  it("accepts both UUIDs and rejects missing, empty and invalid endpoints", () => {
    expect(
      insertSchema.safeParse({ profileId, blogModuleArticleId }).success,
    ).toBe(true);
    for (const data of [
      {},
      { profileId },
      { blogModuleArticleId },
      { profileId: "", blogModuleArticleId },
      { profileId, blogModuleArticleId: "invalid" },
    ]) {
      expect(insertSchema.safeParse(data).success).toBe(false);
    }
  });

  it("cascades both foreign keys without imposing a single-author constraint", () => {
    const config = getTableConfig(Table);
    expect(config.foreignKeys).toHaveLength(2);
    expect(config.foreignKeys.map((key) => key.onDelete)).toEqual([
      "cascade",
      "cascade",
    ]);
    expect(
      config.foreignKeys.map((key) => key.reference().columns[0].name),
    ).toEqual(["pe_id", "bg_me_ae_id"]);
    expect(config.uniqueConstraints).toHaveLength(0);
    expect(route).toBe("/api/social/profiles-to-blog-module-articles");
  });
});
