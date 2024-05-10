import dataFromDb from "./data-from-db.json";
import expected from "./expected-transform.json";
import { transformManyToManyRelations } from "./index";

describe("transform-many-to-many-relations", () => {
  it("should transform object to expecting structure", () => {
    const relationAliases = {
      ["PagesToLayouts"]: {
        toDataKey: "layouts",
        schemaKey: "layout",
      },
    };

    const result = transformManyToManyRelations({
      data: dataFromDb,
      relationAliases,
    });

    expect(result).toEqual(expected);
  });
});
