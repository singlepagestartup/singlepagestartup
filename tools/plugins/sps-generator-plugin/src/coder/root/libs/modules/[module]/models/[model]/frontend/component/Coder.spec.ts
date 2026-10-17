/**
 * BDD Suite: Component RegexCreator.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import {
  ImportVariant,
  ExportVariant,
  ImportInterface,
  ExportInterface,
  AdminPanelComponent,
} from "./Coder";

describe("Component RegexCreator", () => {
  describe("ImportVariant", () => {
    const importPath =
      "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";
    const pascalCasedVariant = "AdminTable";
    const importVariant = new ImportVariant({
      importPath,
      pascalCasedVariant,
    });

    it("should match the regex 1", () => {
      const regex = importVariant.onRemove.regex;

      const string = `import { Component as Simple } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-default";
      import { Component as AdminTable } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";

      export const variants = {
        simple: Simple,
        "admin-table": AdminTable
      };`;

      expect(string).toMatch(regex);
    });
  });

  describe("ExportVariant", () => {
    const kebabCasedVariant = "admin-table";
    const pascalCasedVariant = "AdminTable";
    const exportVariant = new ExportVariant({
      pascalCasedVariant,
      kebabCasedVariant,
    });

    it("should match the regex 1", () => {
      const regex = exportVariant.onRemove.regex;

      const string = `import { Component as Simple } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-default";
      import { Component as AdminTable } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";

      export const variants = {
        simple: Simple,
        "admin-table": AdminTable
      };`;

      expect(string).toMatch(regex);
    });

    it("should match the regex 2", () => {
      const kebabCasedVariant = "admin";
      const pascalCasedVariant = "Admin";
      const exportVariant = new ExportVariant({
        pascalCasedVariant,
        kebabCasedVariant,
      });

      const regex = exportVariant.onRemove.regex;

      const string = `import { Component as Simple } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-default";
      import { Component as Admin } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin";

      export const variants = {
        simple: Simple,
        admin: Admin
      };`;

      expect(string).toMatch(regex);
    });
  });

  describe("ImportInterface", () => {
    const importPath =
      "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";
    const pascalCasedVariant = "AdminTable";
    const importInterface = new ImportInterface({
      importPath,
      pascalCasedVariant,
    });

    it("should match the regex 1", () => {
      const regex = importInterface.onRemove.regex;

      const string = `import { IComponentProps as ISimpleComponentProps } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-default";
      import { IComponentProps as IAdminTableComponentProps } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";

      export type IComponentProps =
        | IAdminTableComponentProps
        | IAdminSelectInputComponentProps
        | IAdminFormComponentProps;`;

      expect(string).toMatch(regex);
    });

    it("should match the regex 2", () => {
      const regex = importInterface.onRemove.regex;

      const string = `import { IComponentProps as ISimpleComponentProps } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-default";
      import { IComponentProps as IAdminTableComponentProps } from "@sps/website-builder-models-page-frontend-component-variants-sps-lite-admin-table";

      export type IComponentProps = IAdminTableComponentProps | IAdminSelectInputComponentProps | IAdminFormComponentProps;`;

      expect(string).toMatch(regex);
    });
  });

  describe("ExportInterface", () => {
    const pascalCasedVariant = "AdminTable";
    const exportInterface = new ExportInterface({
      pascalCasedVariant,
    });

    it("should match the regex 1", () => {
      const regex = exportInterface.onRemove.regex;

      const string = `
      export type IComponentProps =
        | IAdminTableComponentProps
        | IAdminSelectInputComponentProps
        | IAdminFormComponentProps;`;

      expect(string).toMatch(regex);
    });

    it("should match the regex 2", () => {
      const regex = exportInterface.onRemove.regex;

      const string = `
      export type IComponentProps = IAdminTableComponentProps | IAdminSelectInputComponentProps | IAdminFormComponentProps;`;

      expect(string).toMatch(regex);
    });
  });

  describe("AdminPanelComponent", () => {
    const adminPanelComponent = new AdminPanelComponent({
      modelName: "test-model",
      moduleName: "test-module",
    });

    it("should match onCreate regex pattern", () => {
      const testString = `const models = [
        {
          name: "test-model",
          Comp: TestModel,
        },
        {
          name: "other-model",
          Comp: OtherModel,
        }
      ];`;

      expect(testString).toMatch(adminPanelComponent.onCreate.regex);
    });

    it("should match onRemove regex pattern", () => {
      const testString = `const models = [
        {
          name: "test-model",
          Comp: TestModel,
        },
        {
          name: "other-model",
          Comp: OtherModel,
        }
      ];`;

      expect(testString).toMatch(adminPanelComponent.onRemove.regex);
    });

    it("should generate correct content", () => {
      expect(adminPanelComponent.onCreate.content).toContain('"test-model"');
      expect(adminPanelComponent.onCreate.content).toContain("TestModel");
    });

    it("should handle different model names", () => {
      const customComponent = new AdminPanelComponent({
        modelName: "custom-widget",
        moduleName: "website-builder",
      });

      const testString = `const models = [
        {
          name: "custom-widget",
          Comp: CustomWidget,
        }
      ];`;

      expect(testString).toMatch(customComponent.onCreate.regex);
      expect(customComponent.onCreate.content).toContain('"custom-widget"');
      expect(customComponent.onCreate.content).toContain("CustomWidget");
    });
  });
});

it("exports variant-specific public props and replaces the base contract with a startup override", () => {
  const ts = require("typescript") as typeof import("typescript");
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const root = path.resolve("/sps-frontend-contract");
  const files = new Map<string, string>([
    [
      path.join(root, "index.ts"),
      readFileSync(path.join(__dirname, "files/src/index.ts.template"), "utf8"),
    ],
    [path.join(root, "lib/index.ts"), "export const Component = () => null;"],
    [
      path.join(root, "lib/interface.ts"),
      readFileSync(
        path.join(__dirname, "files/src/lib/interface.ts.template"),
        "utf8",
      ),
    ],
    [
      path.join(root, "lib/singlepage/interface.ts"),
      'export type IComponentProps = {variant: "first"; original: string} | {variant: "second"; count: number};',
    ],
    [
      path.join(root, "lib/startup/interface.ts"),
      'export type IComponentProps = {variant: "first"; replacement: boolean} | {variant: "startup-only"; title: string};',
    ],
    [
      path.join(root, "consumer.ts"),
      `import type { IComponentProps } from "./index";
      const first: IComponentProps = {variant: "first", replacement: true};
      const second: IComponentProps = {variant: "second", count: 1};
      const startup: IComponentProps = {variant: "startup-only", title: "Custom"};
      // @ts-expect-error startup replaces the original required props
      const stale: IComponentProps = {variant: "first", original: "Old"};
      // @ts-expect-error the other variant has a different required field
      const missing: IComponentProps = {variant: "second", replacement: true};
      // @ts-expect-error unknown literal
      const unknown: IComponentProps = {variant: "unknown"};
    `,
    ],
  ]);
  const options = { strict: true, noEmit: true, skipLibCheck: true, types: [] };
  const host = ts.createCompilerHost(options);
  const original = {
    fileExists: host.fileExists,
    readFile: host.readFile,
    getSourceFile: host.getSourceFile,
    directoryExists: host.directoryExists,
  };
  host.fileExists = (file) => files.has(file) || original.fileExists(file);
  host.readFile = (file) => files.get(file) ?? original.readFile(file);
  host.directoryExists = (directory) =>
    directory.startsWith(root) ||
    Boolean(original.directoryExists?.(directory));
  host.getSourceFile = (
    file,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) =>
    files.has(file)
      ? ts.createSourceFile(file, files.get(file)!, languageVersion, true)
      : original.getSourceFile(
          file,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        );
  const program = ts.createProgram(
    [path.join(root, "consumer.ts")],
    options,
    host,
  );
  expect(
    ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ),
  ).toEqual([]);
});
