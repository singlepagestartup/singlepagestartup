import { ExportTableAndVaritantEnumTable } from "./Coder";

describe("Coder", () => {
  describe(`ExportTableAndVaritantEnumTable`, () => {
    const moduleName = "SPSWB";
    const modelNamePascalCased = "Slide";
    const importPath = "@sps/website-builder-models-slide-backend-schema";
    const exportSchema = new ExportTableAndVaritantEnumTable({
      moduleName,
      modelNamePascalCased,
      importPath,
    });

    it(`should match the regex 1`, () => {
      const regex = exportSchema.onRemove.regex;

      const string = `export {
        Table as SPSWBSlide,
        Relations as SPSWBSlideRelations,
        VariantEnumTable as SPSWBSlideVariantEnumTable,
      } from "@sps/website-builder-models-slide-backend-schema";
      export {
        Relations,
        populate,
        transformData,
        config,
      } from "@sps/website-builder-models-page-backend-schema-relations";`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportSchema.onRemove.regex;

      const string = `export { Table as SPSWBSlide, Relations as SPSWBSlideRelations, VariantEnumTable as SPSWBSlideVariantEnumTable } from "@sps/website-builder-models-slide-backend-schema";
      export { Relations, populate, transformData, config } from "@sps/website-builder-models-page-backend-schema-relations";`;

      expect(string).toMatch(regex);
    });
  });
});
