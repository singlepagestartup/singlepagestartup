/**
 * BDD Suite: Coder.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

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
      app: createModuleChildApp(wideSlideRoute, this.assembly),
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
      app: createModuleChildApp(wideSlideRoute, this.assembly),
    });
    
    this.apps.push({
      type: "model",
      route: "/layouts",
      app: createModuleChildApp(layouts, this.assembly),
    });
  }
}`;

      const result = string.replace(regex, "");
      const normalizedResult = result.replace(/\s+/g, " ").trim();
      const normalizedExpected =
        'export class Apps { apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] = []; constructor() { this.bindApps(); } bindApps() {this.apps.push({ type: "model", route: "/layouts", app: createModuleChildApp(layouts, this.assembly), }); } }'
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
      app: createModuleChildApp(wideSlideRoute, this.assembly),
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

      const string = `import { serviceBootstrap as wideSlideRoute } from "@sps/website-builder/models/slide/backend/app/root/src/lib/bootstrap";
import { app as layouts } from "@sps/website-builder-models-layout-backend-app";`;

      expect(string).toMatch(regex);
    });

    it("should generate correct import statement", () => {
      const content = importApp.onCreate.content;
      const expected =
        'import { serviceBootstrap as wideSlideRoute } from "@sps/website-builder/models/slide/backend/app/root/src/lib/bootstrap";';

      expect(content).toBe(expected);
    });
  });
});
