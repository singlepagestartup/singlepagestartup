import {
  ImportPopulate,
  ExportPopulate,
  ImportRelation,
  ExportRelation,
} from "./Coder";

describe("Coder", () => {
  describe(`ImportPopulate`, () => {
    const namePropertyCased = "pagesToLayouts";
    const importPath =
      "@sps/website-builder-backend-schema-relations-pages-to-layouts";

    const exportRoute = new ImportPopulate({
      namePropertyCased,
      importPath,
    });

    it(`should match the regex 1`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import { populate as pagesToLayouts } from "@sps/website-builder-backend-schema-relations-pages-to-layouts";
      import { populate as pagesToSlides }
      from "@sps/website-builder-backend-schema-relations-slides-to-pages";`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import {
          populate as pagesToLayouts
        } from "@sps/website-builder-backend-schema-relations-pages-to-layouts";
      import { populate as pages } from "@sps/website-builder-backend-schema-relations-slides-to-pages";`;

      expect(string).toMatch(regex);
    });
  });

  describe(`ExportPopulate`, () => {
    const namePropertyCased = "pagesToLayouts";

    const exportRoute = new ExportPopulate({
      namePropertyCased,
    });

    it(`should match the regex 1`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `export const populate = (params: any) => {
        return {
          pagesToWidgets: pagesToWidgets(params),
          pagesToLayouts: pagesToLayouts(params),
        } as const;
      };`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `export const populate = (params: any) => {
        return { pagesToLayouts: pagesToLayouts(params)} as const;
      };`;

      expect(string).toMatch(regex);
    });
  });

  describe(`ImportRelation`, () => {
    const leftProjectRelationNamePropertyCased = "pages";
    const importPath =
      "@sps/website-builder-backend-schema-relations-slides-to-pages";

    const exportRoute = new ImportRelation({
      leftProjectRelationNamePropertyCased,
      importPath,
    });

    it(`should match the regex 1`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import { relation as layouts } from "@sps/website-builder-models-page-backend-schema-relations-layouts";
      import { relation as pages }
      from "@sps/website-builder-backend-schema-relations-slides-to-pages";`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `import { relation as layouts } from "@sps/website-builder-models-page-backend-schema-relations-layouts";
      import { relation as pages } from "@sps/website-builder-backend-schema-relations-slides-to-pages";`;

      expect(string).toMatch(regex);
    });
  });

  describe(`ExportRelation`, () => {
    const leftProjectRelationNamePropertyCased = "pages";

    const exportRoute = new ExportRelation({
      leftProjectRelationNamePropertyCased,
    });

    it(`should match the regex 1`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `export const Relations = relations(Table, (helpers) => {
        return {
          ...layouts(helpers),
          ...pages(helpers),
        };
      });`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = exportRoute.onRemove.regex;

      const string = `export const Relations = relations(Table, (helpers) => { return { ...layouts(helpers), ...pages(helpers) }; });`;

      expect(string).toMatch(regex);
    });
  });
});
