import { listContentEntityRefs } from "./registry";

describe("content relation discovery", () => {
  it("discovers the profile article relation through its SDK entry points", () => {
    const relation = listContentEntityRefs().find(
      (entity) => entity.key === "social.profiles-to-blog-module-articles",
    );
    expect(relation).toMatchObject({
      kind: "relation",
      module: "social",
      name: "profiles-to-blog-module-articles",
      modelImportPath:
        "@sps/social/relations/profiles-to-blog-module-articles/sdk/model",
      serverImportPath:
        "@sps/social/relations/profiles-to-blog-module-articles/sdk/server",
    });
    expect(relation?.operations).toEqual([
      "find",
      "count",
      "get",
      "create",
      "update",
      "delete",
    ]);
  });
});
