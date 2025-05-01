import { ImportBackendAppApiAsPropertyCasedAppName } from "./Coder";

describe("Coder", () => {
  describe("ImportBackendAppApiAsPropertyCasedAppName", () => {
    const importPath = "@sps/website-builder/backend/app/api";
    const asPropertyCasedAppName = "websiteBuilderApp";
    const importPathApp = new ImportBackendAppApiAsPropertyCasedAppName({
      importPath,
      asPropertyCasedAppName,
    });

    it("should match the regex for removal", () => {
      const regex = importPathApp.onRemove.regex;

      const string = `import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
      import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";`;

      expect(string).toMatch(regex);
    });

    it("should find the place to insert import", () => {
      const regex = importPathApp.onCreate.regex;

      const string = 'export const app = new Hono().basePath("/");';

      expect(string).toMatch(regex);
    });

    it("should correctly insert import before app export", () => {
      const content = importPathApp.onCreate.content;

      expect(content).toBe(
        'import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";\n\nexport const app = new Hono().basePath("/");',
      );
    });
  });
});
