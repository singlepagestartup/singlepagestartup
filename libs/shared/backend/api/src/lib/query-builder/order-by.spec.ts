import * as pgCore from "drizzle-orm/pg-core";
import { queryBuilder, QueryBuilderQueryOperators } from "./order-by";

export const Table = pgCore.pgTable("button", {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  title: pgCore.text("title"),
});

describe.skip("Query Builder | Order By", () => {
  it("should take function from passed orderBy method", () => {
    // const params = {
    //   orderBy: {
    //     column: "title" as keyof (typeof Table)["$inferSelect"],
    //     method: "asc" as keyof QueryBuilderQueryOperators,
    //   },
    // };
    // const populateParams = queryBuilder<typeof Table>(params);
    // expect(typeof populateParams["orderBy"]).toBe("function");
  });
});
