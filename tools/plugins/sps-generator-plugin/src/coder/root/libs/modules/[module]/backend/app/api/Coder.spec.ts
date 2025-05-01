import { ImportBackendAppApiAsPropertyCasedAppName } from "./Coder";

describe("Coder", () => {
  describe("ImportBackendAppApiAsPropertyCasedAppName", () => {
    const importPath = "@sps/website-builder/backend/app/api";
    const asPropertyCasedAppName = "websiteBuilderApp";
    const importPathApp = new ImportBackendAppApiAsPropertyCasedAppName({
      importPath,
      asPropertyCasedAppName,
    });

    it("should match the regex 1", () => {
      const regex = importPathApp.onRemove.regex;

      const string = `import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
      import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";`;

      expect(string).toMatch(regex);
    });
  });
});
