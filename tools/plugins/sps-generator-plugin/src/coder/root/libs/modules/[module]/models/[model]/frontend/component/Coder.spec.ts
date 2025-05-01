import {
  ImportVariant,
  ExportVariant,
  ImportInterface,
  ExportInterface,
} from "./Coder";

describe("Coder", () => {
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
    const importPath = new ExportVariant({
      pascalCasedVariant,
      kebabCasedVariant,
    });

    it("should match the regex 1", () => {
      const regex = importPath.onRemove.regex;

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
      const importPath = new ExportVariant({
        pascalCasedVariant,
        kebabCasedVariant,
      });

      const regex = importPath.onRemove.regex;

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
});
