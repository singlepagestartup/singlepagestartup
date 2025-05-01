import { BindApp, ImportApp } from "./Coder";

describe("Coder", () => {
  describe("BindApp", () => {
    const route = "/wide-slide-route";
    const asPropertyModelName = "wideSlideRoute";

    const bindApp = new BindApp({ route, asPropertyModelName });

    it("should match the regex for apps.push format", () => {
      const regex = bindApp.onRemove.regex;

      const string = `export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/wide-slide-route",
      app: wideSlideRoute,
    });
  }
}`;

      const result = string.replace(regex, "");
      const normalizedResult = result.replace(/\s+/g, " ").trim();
      const normalizedExpected =
        'export class Apps { apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = []; constructor() { this.bindApps(); } bindApps() {} }'
          .replace(/\s+/g, " ")
          .trim();

      expect(normalizedResult).toBe(normalizedExpected);
    });

    it("should match the regex with different spacing", () => {
      const regex = bindApp.onRemove.regex;

      const string = `export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/wide-slide-route",
      app: wideSlideRoute,
    });
    
    this.apps.push({
      type: "model",
      route: "/layouts",
      app: layouts,
    });
  }
}`;

      const result = string.replace(regex, "");
      const normalizedResult = result.replace(/\s+/g, " ").trim();
      const normalizedExpected =
        'export class Apps { apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = []; constructor() { this.bindApps(); } bindApps() {this.apps.push({ type: "model", route: "/layouts", app: layouts, }); } }'
          .replace(/\s+/g, " ")
          .trim();

      expect(normalizedResult).toBe(normalizedExpected);
    });

    it("should generate correct onCreate content", () => {
      const content = bindApp.onCreate.content;
      const expected = `bindApps() {
    this.apps.push({
      type: "model",
      route: "/wide-slide-route",
      app: wideSlideRoute,
    });`;

      expect(content).toBe(expected);
    });
  });

  describe("ImportPath", () => {
    const importPath = "@sps/website-builder/models/slide/backend/app/root";
    const asPropertyModelName = "wideSlideRoute";
    const importApp = new ImportApp({
      importPath,
      asPropertyModelName,
    });

    it("should match the regex for import statement", () => {
      const regex = importApp.onRemove.regex;

      const string = `import { app as wideSlideRoute } from "@sps/website-builder/models/slide/backend/app/root";
import { app as layouts } from "@sps/website-builder-models-layout-backend-app";`;

      expect(string).toMatch(regex);
    });

    it("should generate correct import statement", () => {
      const content = importApp.onCreate.content;
      const expected =
        'import { app as wideSlideRoute } from "@sps/website-builder/models/slide/backend/app/root";';

      expect(content).toBe(expected);
    });
  });
});
