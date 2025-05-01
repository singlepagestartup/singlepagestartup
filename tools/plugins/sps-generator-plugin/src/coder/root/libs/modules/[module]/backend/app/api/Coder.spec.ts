import {
  ImportBackendAppApiAsPropertyCasedAppName,
  ExtendAppRouteWithAppHono,
} from "./Coder";

describe("Coder", () => {
  describe("ImportBackendAppApiAsPropertyCasedAppName", () => {
    const importPath = "@sps/website-builder/backend/app/api";
    const asPropertyCasedAppName = "websiteBuilder";
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

  describe("ExtendAppRouteWithAppHono", () => {
    const asPropertyCasedAppName = "websiteBuilder";
    const kebabCasedAppName = "website-builder";
    const extendAppRoute = new ExtendAppRouteWithAppHono({
      asPropertyCasedAppName,
      kebabCasedAppName,
    });

    it("should correctly create route content", () => {
      const content = extendAppRoute.onCreate.content;

      expect(content).toBe(
        `app.route("/api/${kebabCasedAppName}", ${asPropertyCasedAppName}App.hono);\n`,
      );
    });

    it("should match the regex for route removal", () => {
      const regex = extendAppRoute.onRemove.regex;

      const string = `app.route("/api/${kebabCasedAppName}", ${asPropertyCasedAppName}App.hono);`;

      expect(string).toMatch(regex);
    });
  });
});
