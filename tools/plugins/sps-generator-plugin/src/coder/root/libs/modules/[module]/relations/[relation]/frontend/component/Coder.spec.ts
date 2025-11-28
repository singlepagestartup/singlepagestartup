import {
  ImportVariant,
  ExportVariant,
  ImportInterface,
  ExportInterface,
  AdminPanelComponent,
  ImportRelationForm,
  ExtendInterface,
  AddRelationComponent,
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

  describe("ImportRelationForm", () => {
    const importRelationForm = new ImportRelationForm();

    it("should match the regex for imports", () => {
      const regex = importRelationForm.onRemove.regex;

      const string = `import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { IComponentPropsExtended, variant, IModel } from "./interface";`;

      expect(string).toMatch(regex);
    });

    it("should generate correct import content", () => {
      expect(importRelationForm.onCreate.content).toBe(
        'import { ReactNode } from "react";\nimport { ISpsComponentBase } from "@sps/ui-adapter";',
      );
    });
  });

  describe("ExtendInterface", () => {
    const relationNamePascalCased = "buttonsArraysToButtons";
    const extendInterface = new ExtendInterface({
      relationNamePascalCased,
    });

    it("should match the regex for interface extension", () => {
      const regex = extendInterface.onCreate.regex;

      const string = `export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  buttonsArraysToButtons?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}`;

      expect(string).toMatch(regex);
    });

    it("should generate correct interface content", () => {
      const content = extendInterface.onCreate.content;
      expect(content).toMatch(/buttonsArraysToButtons\?:/);
      expect(content).toMatch(/props: ISpsComponentBase & { data\?: IModel }/);
      expect(content).toMatch(/=> ReactNode;/);
      expect(content.trim().startsWith("  buttonsArraysToButtons"));
    });

    it("should match different relation names", () => {
      const customInterface = new ExtendInterface({
        relationNamePascalCased: "customRelation",
      });

      const string = `export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  customRelation?: (
    props: ISpsComponentBase & { data?: IModel },
  ) => ReactNode;
}`;

      expect(string).toMatch(customInterface.onCreate.regex);
    });
  });

  describe("AddRelationComponent", () => {
    const relationNamePascalCased = "buttonsArraysToButtons";
    const addRelationComponent = new AddRelationComponent({
      relationNamePascalCased,
    });

    it("should match the regex for component JSX", () => {
      const regex = addRelationComponent.onCreate.regex;

      const string = `<div className="flex flex-col gap-6">
        {props.buttonsArraysToButtons
          ? props.buttonsArraysToButtons({
              data: props.data,
              isServer: props.isServer,
            })
          : null}`;

      expect(string).toMatch(regex);
    });

    it("should generate correct component content", () => {
      const content = addRelationComponent.onCreate.content;
      expect(content).toMatch(/props\.buttonsArraysToButtons/);
      expect(content).toMatch(/data: props\.data/);
      expect(content).toMatch(/isServer: props\.isServer/);
      expect(content.startsWith("        {props"));
    });

    it("should match different relation names", () => {
      const customComponent = new AddRelationComponent({
        relationNamePascalCased: "customRelation",
      });

      const string = `<div className="flex flex-col gap-6">
        {props.customRelation
          ? props.customRelation({
              data: props.data,
              isServer: props.isServer,
            })
          : null}`;

      expect(string).toMatch(customComponent.onCreate.regex);
    });

    it("should match with different formatting", () => {
      const regex = addRelationComponent.onCreate.regex;

      const string = `<div className="flex flex-col gap-6">
        {props.buttonsArraysToButtons ? props.buttonsArraysToButtons({ data: props.data, isServer: props.isServer }) : null}`;

      expect(string).toMatch(regex);
    });
  });
});
