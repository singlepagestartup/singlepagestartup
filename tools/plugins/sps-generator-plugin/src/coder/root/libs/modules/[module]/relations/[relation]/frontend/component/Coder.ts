import {
  getProjects,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from "@nx/devkit";
import { Coder as FrontendCoder } from "../Coder";
import { util as createSpsReactLibrary } from "../../../../../../../../../utils/create-sps-react-library";
import path from "path";
import { util as getNameStyles } from "../../../../../../../../utils/get-name-styles";
import { RegexCreator } from "tools/plugins/sps-generator-plugin/src/utils/regex-utils/RegexCreator";
import {
  space,
  comma,
  doubleQuote,
} from "../../../../../../../../../utils/regex-utils/regex-elements";
import {
  addToFile,
  replaceInFile,
} from "tools/plugins/sps-generator-plugin/src/utils/file-utils";

interface IVariantProps {
  name: string;
  level: string;
  template: string;
  path: string;
}

export type IGeneratorProps = {
  variants?: IVariantProps[];
};

export class Coder {
  parent: FrontendCoder;
  tree: Tree;
  baseName: string;
  absoluteName: string;
  baseDirectory: string;
  name: string;
  project?: ProjectConfiguration;
  variants: IVariantProps[];
  importPath: string;
  constructor(props: { parent: FrontendCoder; tree: Tree } & IGeneratorProps) {
    this.name = "component";
    this.baseName = `${props.parent.baseName}-component`;
    this.baseDirectory = `${props.parent.baseDirectory}/component`;
    this.absoluteName = `${props.parent.absoluteName}/component`;
    this.tree = props.tree;
    this.parent = props.parent;
    this.variants = props.variants ?? [];
    this.importPath = this.absoluteName;
  }

  async migrate(props: { version: string }) {
    // await this.project.root.migrate(props);
    // if (this.project.variants) {
    //   for (const variant of this.project.variants) {
    //     await variant.migrate(props);
    //   }
    // }
  }

  async create() {
    await createSpsReactLibrary({
      root: this.baseDirectory,
      name: this.baseName,
      tree: this.tree,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);

    for (const variant of this.variants) {
      await this.createVariant(variant);
    }

    await this.attach();
  }

  async createVariant(props: IVariantProps) {
    const moduleName = this.parent.parent.parent.parent.name;
    const modelName = this.parent.parent.name;

    const relationName = this.parent.parent.name;

    const leftModel = this.parent.parent.parent.project.relation.models[0];
    const leftModelModuleName = leftModel.module;
    const leftModelName = leftModel.name;
    const leftModelNameStyles = getNameStyles({
      name: leftModelName,
    });
    const leftModelIdFieldName = `${leftModelNameStyles.propertyCased.base}Id`;
    const leftModelFrontendComponentImportPath = `@sps/${leftModelModuleName}/models/${leftModelName}/frontend/component`;

    const rightModel = this.parent.parent.parent.project.relation.models[1];
    const rightModelModuleName = rightModel.module;
    const rightModelName = rightModel.name;
    const rightModelNameStyles = getNameStyles({
      name: rightModelName,
    });
    const rightModelIdFieldName = `${rightModelNameStyles.propertyCased.base}Id`;
    const rightModelFrontendComponentImportPath = `@sps/${rightModelModuleName}/models/${rightModelName}/frontend/component`;

    const sdkClientImportPath =
      this.parent.parent.project.sdk.project.client.importPath;
    const sdkServerImportPath =
      this.parent.parent.project.sdk.project.server.importPath;
    const sdkModelImportPath =
      this.parent.parent.project.sdk.project.model.importPath;

    const templateDirectory = path.join(
      __dirname,
      `templates/${props.template}`,
    );

    const offsetFromRootProject = offsetFromRoot(this.baseDirectory);

    const modelNameStyled = getNameStyles({
      name: modelName,
    });

    const variantNameStyled = getNameStyles({
      name: props.name,
    });

    const variantComponentImportPath = `./${props.path}`;
    const variantInterfaceImportPath = `./${props.path}/interface`;

    await createSpsReactLibrary({
      root: this.baseDirectory + `/src/lib/${props.level}/${props.path}`,
      name: this.baseName,
      tree: this.tree,
      generateFilesPath: templateDirectory,
      templateParams: {
        template: "",
        template_name: props.template,
        variant: props.name,
        module_name: moduleName,
        model_name: modelName,
        level: props.level,
        sdk_client_import_path: sdkClientImportPath,
        sdk_server_import_path: sdkServerImportPath,
        offset_from_root: offsetFromRootProject,
        model_name_kebab_cased_pluralized:
          modelNameStyled.kebabCased.pluralized,
        model_name_pluralized: modelNameStyled.snakeCased.pluralized,
        relation_name: relationName,
        sdk_model_import_path: sdkModelImportPath,
        left_model_name_pascal_cased: leftModelNameStyles.pascalCased.base,
        left_model_id_field_name: leftModelIdFieldName,
        left_model_frontend_component_import_path:
          leftModelFrontendComponentImportPath,
        right_model_name_pascal_cased: rightModelNameStyles.pascalCased.base,
        right_model_id_field_name: rightModelIdFieldName,
        right_model_frontend_component_import_path:
          rightModelFrontendComponentImportPath,
      },
    });

    this.tree.delete(
      this.baseDirectory + `/src/lib/${props.level}/${props.path}/index.ts`,
    );

    const variantsPath =
      this.baseDirectory + `/src/lib/${props.level}/variants.ts`;
    const interfacePath =
      this.baseDirectory + `/src/lib/${props.level}/interface.ts`;

    const importVariant = new ImportVariant({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      importPath: variantComponentImportPath,
    });

    const exportVariant = new ExportVariant({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      kebabCasedVariant: variantNameStyled.kebabCased.base,
    });

    const importInterface = new ImportInterface({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      importPath: variantInterfaceImportPath,
    });

    const exportInterface = new ExportInterface({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
    });

    await addToFile({
      toTop: true,
      pathToFile: variantsPath,
      content: importVariant.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: variantsPath,
      regex: exportVariant.onCreate.regex,
      content: exportVariant.onCreate.content,
    });

    await addToFile({
      toTop: true,
      pathToFile: interfacePath,
      content: importInterface.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: interfacePath,
      regex: exportInterface.onCreate.regex,
      content: exportInterface.onCreate.content,
    });

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: interfacePath,
        regex: new RegExp("[|](\\s+)+?[|]"),
        content: "|",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }
  }

  async attach() {
    const relationNameStyled = getNameStyles({
      name: this.parent.parent.name,
    });
    const relationNamePascalCased = relationNameStyled.pascalCased.base;
    const relationNamePropertyCased = relationNameStyled.propertyCased.base;

    const leftModel = this.parent.parent.parent.project.relation.models[0];
    const rightModel = this.parent.parent.parent.project.relation.models[1];

    // Interface file paths
    const leftModelInterfacePath = `libs/modules/${leftModel.module}/models/${leftModel.name}/frontend/component/src/lib/singlepage/admin/form/interface.ts`;
    const rightModelInterfacePath = `libs/modules/${rightModel.module}/models/${rightModel.name}/frontend/component/src/lib/singlepage/admin/form/interface.ts`;

    // Component file paths
    const leftModelFormPath = `libs/modules/${leftModel.module}/models/${leftModel.name}/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx`;
    const rightModelFormPath = `libs/modules/${rightModel.module}/models/${rightModel.name}/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx`;

    // Admin component paths
    const leftModelAdminPath = `libs/modules/${leftModel.module}/frontend/component/src/lib/admin/${leftModel.name}/Component.tsx`;
    const rightModelAdminPath = `libs/modules/${rightModel.module}/frontend/component/src/lib/admin/${rightModel.name}/Component.tsx`;

    const importRelationForm = new ImportRelationForm();
    const extendInterface = new ExtendInterface({ relationNamePascalCased });
    const addRelationComponent = new AddRelationComponent({
      relationNamePascalCased,
    });

    // Process left model admin component
    if (this.tree.exists(leftModelAdminPath)) {
      const importRelationComponent = new ImportRelationComponent({
        relationNamePascalCased,
        moduleName: this.parent.parent.parent.parent.name,
        relationName: this.parent.parent.name,
      });

      const addRelationToAdminComponent = new AddRelationToAdminComponent({
        relationNamePascalCased,
        relationNamePropertyCased,
        leftModel,
        rightModel,
        isLeftModel: true,
      });

      await replaceInFile({
        tree: this.tree,
        pathToFile: leftModelAdminPath,
        regex: importRelationComponent.onCreate.placeRegex,
        content:
          importRelationComponent.onCreate.content +
          importRelationComponent.onCreate.place,
      });

      await replaceInFile({
        tree: this.tree,
        pathToFile: leftModelAdminPath,
        regex: addRelationToAdminComponent.onCreate.regex,
        content: addRelationToAdminComponent.onCreate.content,
      });
    }

    // Process right model admin component
    if (this.tree.exists(rightModelAdminPath)) {
      const importRelationComponent = new ImportRelationComponent({
        relationNamePascalCased,
        moduleName: this.parent.parent.parent.parent.name,
        relationName: this.parent.parent.name,
      });

      const addRelationToAdminComponent = new AddRelationToAdminComponent({
        relationNamePascalCased,
        relationNamePropertyCased,
        leftModel,
        rightModel,
        isLeftModel: false,
      });

      await replaceInFile({
        tree: this.tree,
        pathToFile: rightModelAdminPath,
        regex: importRelationComponent.onCreate.placeRegex,
        content:
          importRelationComponent.onCreate.content +
          importRelationComponent.onCreate.place,
      });

      await replaceInFile({
        tree: this.tree,
        pathToFile: rightModelAdminPath,
        regex: addRelationToAdminComponent.onCreate.regex,
        content: addRelationToAdminComponent.onCreate.content,
      });
    }

    // Process left model interface and form
    if (this.tree.exists(leftModelInterfacePath)) {
      const [hasReactNode, hasSpsComponentBase] =
        await importRelationForm.checkImports(
          this.tree,
          leftModelInterfacePath,
        );

      if (!hasReactNode || !hasSpsComponentBase) {
        await addToFile({
          toTop: true,
          pathToFile: leftModelInterfacePath,
          content:
            !hasReactNode && !hasSpsComponentBase
              ? importRelationForm.onCreate.content
              : !hasReactNode
                ? 'import { ReactNode } from "react";'
                : 'import { ISpsComponentBase } from "@sps/ui-adapter";',
          tree: this.tree,
        });
      }

      await replaceInFile({
        tree: this.tree,
        pathToFile: leftModelInterfacePath,
        regex: extendInterface.onCreate.regex,
        content: extendInterface.onCreate.content,
      });
    }

    // Process right model interface and form
    if (this.tree.exists(rightModelInterfacePath)) {
      const [hasReactNode, hasSpsComponentBase] =
        await importRelationForm.checkImports(
          this.tree,
          rightModelInterfacePath,
        );

      if (!hasReactNode || !hasSpsComponentBase) {
        await addToFile({
          toTop: true,
          pathToFile: rightModelInterfacePath,
          content:
            !hasReactNode && !hasSpsComponentBase
              ? importRelationForm.onCreate.content
              : !hasReactNode
                ? 'import { ReactNode } from "react";'
                : 'import { ISpsComponentBase } from "@sps/ui-adapter";',
          tree: this.tree,
        });
      }

      await replaceInFile({
        tree: this.tree,
        pathToFile: rightModelInterfacePath,
        regex: extendInterface.onCreate.regex,
        content: extendInterface.onCreate.content,
      });
    }

    // Process components
    if (this.tree.exists(leftModelFormPath)) {
      await replaceInFile({
        tree: this.tree,
        pathToFile: leftModelFormPath,
        regex: addRelationComponent.onCreate.regex,
        content: addRelationComponent.onCreate.content,
      });
    }

    if (this.tree.exists(rightModelFormPath)) {
      await replaceInFile({
        tree: this.tree,
        pathToFile: rightModelFormPath,
        regex: addRelationComponent.onCreate.regex,
        content: addRelationComponent.onCreate.content,
      });
    }
  }

  async removeVariant(props: IVariantProps) {
    const variantsPath =
      this.baseDirectory + `/src/lib/${props.level}/variants.ts`;
    const interfacePath =
      this.baseDirectory + `/src/lib/${props.level}/interface.ts`;

    const variantNameStyled = getNameStyles({
      name: props.name,
    });

    const variantComponentImportPath = `./${props.path}`;
    const variantInterfaceImportPath = `./${props.path}/interface`;

    const importVariant = new ImportVariant({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      importPath: variantComponentImportPath,
    });

    const exportVariant = new ExportVariant({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      kebabCasedVariant: variantNameStyled.kebabCased.base,
    });

    const importInterface = new ImportInterface({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
      importPath: variantInterfaceImportPath,
    });

    const exportInterface = new ExportInterface({
      pascalCasedVariant: variantNameStyled.pascalCased.base,
    });

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: variantsPath,
        regex: importVariant.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: variantsPath,
        regex: exportVariant.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: interfacePath,
        regex: importInterface.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: interfacePath,
        regex: exportInterface.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    this.tree.delete(
      this.baseDirectory + `/src/lib/${props.level}/${props.path}`,
    );
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }

  async detach() {
    const relationNameStyled = getNameStyles({
      name: this.parent.parent.name,
    });
    const relationNamePascalCased = relationNameStyled.pascalCased.base;
    const relationNamePropertyCased = relationNameStyled.propertyCased.base;

    const leftModel = this.parent.parent.parent.project.relation.models[0];
    const rightModel = this.parent.parent.parent.project.relation.models[1];

    // Interface file paths
    const leftModelInterfacePath = `libs/modules/${leftModel.module}/models/${leftModel.name}/frontend/component/src/lib/singlepage/admin/form/interface.ts`;
    const rightModelInterfacePath = `libs/modules/${rightModel.module}/models/${rightModel.name}/frontend/component/src/lib/singlepage/admin/form/interface.ts`;

    // Component file paths
    const leftModelFormPath = `libs/modules/${leftModel.module}/models/${leftModel.name}/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx`;
    const rightModelFormPath = `libs/modules/${rightModel.module}/models/${rightModel.name}/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx`;

    // Admin component paths
    const leftModelAdminPath = `libs/modules/${leftModel.module}/frontend/component/src/lib/admin/${leftModel.name}/Component.tsx`;
    const rightModelAdminPath = `libs/modules/${rightModel.module}/frontend/component/src/lib/admin/${rightModel.name}/Component.tsx`;

    // Remove from left model admin component
    if (this.tree.exists(leftModelAdminPath)) {
      const removeRelationImport = new RemoveRelationImport({
        relationNamePascalCased,
        moduleName: this.parent.parent.parent.parent.name,
        relationName: this.parent.parent.name,
      });

      const removeRelationFromAdminComponent =
        new RemoveRelationFromAdminComponent({
          relationNamePascalCased,
          relationNamePropertyCased,
          leftModel,
          rightModel,
          isLeftModel: true,
        });

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: leftModelAdminPath,
          regex: removeRelationImport.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: leftModelAdminPath,
          regex: removeRelationFromAdminComponent.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }

    // Remove from right model admin component
    if (this.tree.exists(rightModelAdminPath)) {
      const removeRelationImport = new RemoveRelationImport({
        relationNamePascalCased,
        moduleName: this.parent.parent.parent.parent.name,
        relationName: this.parent.parent.name,
      });

      const removeRelationFromAdminComponent =
        new RemoveRelationFromAdminComponent({
          relationNamePascalCased,
          relationNamePropertyCased,
          leftModel,
          rightModel,
          isLeftModel: false,
        });

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: rightModelAdminPath,
          regex: removeRelationImport.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: rightModelAdminPath,
          regex: removeRelationFromAdminComponent.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }

    // Remove from interface and form components
    const removeRelationFromInterface = new RegexCreator({
      place: "",
      placeRegex: new RegExp(""),
      content: "",
      contentRegex: new RegExp(
        `(${space})*${relationNamePropertyCased}\\?:\\s*\\([\\s\\n]*props:\\s*ISpsComponentBase\\s*&\\s*{\\s*data\\?:\\s*IModel\\s*},[\\s\\n]*\\)\\s*=>\\s*ReactNode;`,
        "gm",
      ),
    });

    const removeRelationFromComponent = new RegexCreator({
      place: "",
      placeRegex: new RegExp(""),
      content: "",
      contentRegex: new RegExp(
        `${space}{["']\\s*["']}${space}{${space}props\\.${relationNamePropertyCased}[\\s\\n]*\\?[\\s\\n]*props\\.${relationNamePropertyCased}\\([\\s\\n]*{[\\s\\n]*data:[\\s\\n]*props\\.data,[\\s\\n]*isServer:[\\s\\n]*props\\.isServer,[\\s\\n]*}[\\s\\n]*\\)[\\s\\n]*:[\\s\\n]*null}`,
        "gm",
      ),
    });

    // Process left model interface and form
    if (this.tree.exists(leftModelInterfacePath)) {
      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: leftModelInterfacePath,
          regex: removeRelationFromInterface.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }

    if (this.tree.exists(leftModelFormPath)) {
      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: leftModelFormPath,
          regex: removeRelationFromComponent.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }

    // Process right model interface and form
    if (this.tree.exists(rightModelInterfacePath)) {
      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: rightModelInterfacePath,
          regex: removeRelationFromInterface.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }

    if (this.tree.exists(rightModelFormPath)) {
      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: rightModelFormPath,
          regex: removeRelationFromComponent.onRemove.regex,
          content: "",
        });
      } catch (error: any) {
        if (!error.message.includes("No expected value")) {
          throw error;
        }
      }
    }
  }
}

export class ImportVariant extends RegexCreator {
  constructor(props: { pascalCasedVariant: string; importPath: string }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `import { Component as ${props.pascalCasedVariant} } from "${props.importPath}";`;

    const contentRegex = new RegExp(
      `import${space}{${space}Component${space}as${space}${props.pascalCasedVariant}${space}}${space}from${space}"${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      contentRegex,
      content,
    });
  }
}

export class ExportVariant extends RegexCreator {
  constructor({
    pascalCasedVariant,
    kebabCasedVariant,
  }: {
    pascalCasedVariant: string;
    kebabCasedVariant: string;
  }) {
    const place = "export const variants = {";
    const placeRegex = new RegExp("export const variants = {");

    const content = `"${kebabCasedVariant}":${pascalCasedVariant},`;
    const contentRegex = new RegExp(
      `${doubleQuote}${kebabCasedVariant}${doubleQuote}:${space}${pascalCasedVariant}${comma}`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ImportInterface extends RegexCreator {
  constructor(props: { pascalCasedVariant: string; importPath: string }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `import { IComponentProps as I${props.pascalCasedVariant}ComponentProps } from "${props.importPath}";`;

    const contentRegex = new RegExp(
      `import${space}{${space}IComponentProps${space}as${space}I${props.pascalCasedVariant}ComponentProps }${space}from${space}"${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      contentRegex,
      content,
    });
  }
}

export class ExportInterface extends RegexCreator {
  constructor(props: { pascalCasedVariant: string }) {
    const place = "export type IComponentProps =";
    const placeRegex = new RegExp(`export type IComponentProps =${space}[|]?`);

    const content = `I${props.pascalCasedVariant}ComponentProps |`;
    const contentRegex = new RegExp(
      `I${props.pascalCasedVariant}ComponentProps${space}[|]`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class AdminPanelComponent extends RegexCreator {
  constructor(props: { modelName: string; moduleName: string }) {
    const place = "const models = [";
    const placeRegex = new RegExp("const models = \\[");

    const content = `{
      name: "${props.modelName}",
      Comp: ${getNameStyles({ name: props.modelName }).pascalCased.base},
    },`;

    const contentRegex = new RegExp(
      `{[\\s\\n]*name:[\\s]*"${props.modelName}",[\\s\\n]*Comp:[\\s]*${
        getNameStyles({ name: props.modelName }).pascalCased.base
      },[\\s\\n]*},`,
      "gm",
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ImportRelationForm extends RegexCreator {
  constructor() {
    const place = "";
    const placeRegex = new RegExp("");
    const content =
      'import { ReactNode } from "react";\nimport { ISpsComponentBase } from "@sps/ui-adapter";';
    const contentRegex = new RegExp(
      `import${space}{${space}(ReactNode|ISpsComponentBase)${space}}${space}from${space}["'](@sps/ui-adapter|react)["'];`,
      "gm",
    );

    super({ place, placeRegex, content, contentRegex });
  }

  async checkImports(tree: Tree, filePath: string): Promise<boolean[]> {
    const fileContent = tree.read(filePath)?.toString() || "";
    const reactNodeImport = /import\s*{\s*ReactNode\s*}\s*from\s*["']react["']/;
    const spsComponentBaseImport =
      /import\s*{\s*ISpsComponentBase\s*}\s*from\s*["']@sps\/ui-adapter["']/;

    return [
      reactNodeImport.test(fileContent),
      spsComponentBaseImport.test(fileContent),
    ];
  }
}

export class ExtendInterface extends RegexCreator {
  constructor({
    relationNamePascalCased,
  }: {
    relationNamePascalCased: string;
  }) {
    const place =
      "export interface IComponentProps extends IParentComponentProps<IModel, typeof variant> {";
    const placeRegex = new RegExp(
      `export${space}interface${space}IComponentProps${space}extends${space}IParentComponentProps${space}<${space}IModel${comma}${space}typeof${space}variant${space}>${space}{`,
    );
    const content = `
     ${getNameStyles({ name: relationNamePascalCased }).propertyCased.base}?: (
       props: ISpsComponentBase & { data?: IModel },
     ) => ReactNode;`;
    const contentRegex = new RegExp(
      `${getNameStyles({ name: relationNamePascalCased }).propertyCased.base}\\?:${space}\\(${space}props:${space}ISpsComponentBase${space}&${space}{${space}data\\?:${space}IModel${space}}${space}\\)${space}=>${space}ReactNode;`,
    );
    super({ place, placeRegex, content, contentRegex });
  }
}

export class AddRelationComponent extends RegexCreator {
  constructor({
    relationNamePascalCased,
  }: {
    relationNamePascalCased: string;
  }) {
    const place = '<div className="flex flex-col gap-6">';
    const placeRegex = new RegExp(
      '<div[^>]*className\\s*=\\s*"[^"]*flex[^"]*col[^"]*gap-6[^"]*"[^>]*>',
    );
    const propertyName = getNameStyles({ name: relationNamePascalCased })
      .propertyCased.base;
    const content = `        {props.${propertyName}
          ? props.${propertyName}({
              data: props.data,
              isServer: props.isServer,
            })
          : null}`;
    const contentRegex = new RegExp(
      `{\\s*props\\.${propertyName}\\s*\\?\\s*props\\.${propertyName}\\s*\\(\\s*{[\\s\\n]*data\\s*:\\s*props\\.data\\s*,[\\s\\n]*isServer\\s*:\\s*props\\.isServer[\\s\\n]*}\\s*\\)\\s*:\\s*null\\s*}`,
    );
    super({ place, placeRegex, content, contentRegex });
  }
}

export class ImportRelationComponent extends RegexCreator {
  protected contentRegex: RegExp;
  protected content: string;
  protected place: string;
  protected placeRegex: RegExp;
  public onCreate: {
    regex: RegExp;
    content: string;
    place: string;
    placeRegex: RegExp;
  };

  constructor(props: {
    relationNamePascalCased: string;
    moduleName: string;
    relationName: string;
  }) {
    const place = "export function Component";
    const placeRegex = new RegExp("export function Component");
    const content = `import { Component as ${props.relationNamePascalCased} } from "@sps/${props.moduleName}/relations/${props.relationName}/frontend/component";\n\n`;
    const contentRegex = new RegExp(
      `import${space}{${space}Component${space}as${space}${props.relationNamePascalCased}${space}}${space}from${space}"@sps/${props.moduleName}/relations/${props.relationName}/frontend/component";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });

    this.place = place;
    this.placeRegex = placeRegex;
    this.content = content;
    this.contentRegex = contentRegex;

    this.onCreate = {
      regex: this.contentRegex,
      content: this.content,
      place: this.place,
      placeRegex: this.placeRegex,
    };
  }
}

export class AddRelationToAdminComponent extends RegexCreator {
  constructor(props: {
    relationNamePascalCased: string;
    relationNamePropertyCased: string;
    leftModel: any;
    rightModel: any;
    isLeftModel: boolean;
  }) {
    const place = 'variant="admin-form"';
    const placeRegex = new RegExp('variant="admin-form"');

    const currentModel = props.isLeftModel ? props.leftModel : props.rightModel;
    const currentModelNameStyled = getNameStyles({
      name: currentModel.name,
    });

    const content = `
            ${props.relationNamePropertyCased}={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <${props.relationNamePascalCased}
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "${currentModelNameStyled.propertyCased.base}Id",
                            method: "eq",
                            value: data.id,
                          },
                        ],
                      },
                    },
                  }}
                />
              );
            }}`;

    const contentRegex = new RegExp(
      `variant="admin-form"[\\s\\n]*${props.relationNamePropertyCased}=\\{\\([\\s\\n]*{[\\s\\n]*data,[\\s\\n]*isServer[\\s\\n]*}[\\s\\n]*\\)[\\s\\n]*=>[\\s\\n]*{[\\s\\n]*if[\\s\\n]*\\(!data\\)[\\s\\n]*{[\\s\\n]*return;[\\s\\n]*}[\\s\\n]*return[\\s\\n]*\\([\\s\\n]*<${props.relationNamePascalCased}[\\s\\n]*isServer={isServer}[\\s\\n]*variant="admin-table"[\\s\\n]*apiProps={{[\\s\\n]*params:[\\s\\n]*{[\\s\\n]*filters:[\\s\\n]*{[\\s\\n]*and:[\\s\\n]*\\[[\\s\\n]*{[\\s\\n]*column:[\\s\\n]*"${currentModelNameStyled.propertyCased.base}Id",[\\s\\n]*method:[\\s\\n]*"eq",[\\s\\n]*value:[\\s\\n]*data\\.id,[\\s\\n]*},[\\s\\n]*\\],[\\s\\n]*},[\\s\\n]*},[\\s\\n]*}}[\\s\\n]*\\/>[\\s\\n]*\\);[\\s\\n]*}}`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class RemoveRelationImport extends RegexCreator {
  constructor(props: {
    relationNamePascalCased: string;
    moduleName: string;
    relationName: string;
  }) {
    const place = "";
    const placeRegex = new RegExp("");
    const content = "";
    const contentRegex = new RegExp(
      `import${space}{${space}Component${space}as${space}${props.relationNamePascalCased}${space}}${space}from${space}"@sps/${props.moduleName}/relations/${props.relationName}/frontend/component";[\\s\\n]*`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class RemoveRelationFromAdminComponent extends RegexCreator {
  constructor(props: {
    relationNamePascalCased: string;
    relationNamePropertyCased: string;
    leftModel: any;
    rightModel: any;
    isLeftModel: boolean;
  }) {
    const place = "";
    const placeRegex = new RegExp("");
    const content = "";

    const currentModel = props.isLeftModel ? props.leftModel : props.rightModel;
    const currentModelNameStyled = getNameStyles({
      name: currentModel.name,
    });

    const contentRegex = new RegExp(
      `[\\s\\n]*${props.relationNamePropertyCased}=\\{\\([\\s\\n]*{[\\s\\n]*data,[\\s\\n]*isServer[\\s\\n]*}[\\s\\n]*\\)[\\s\\n]*=>[\\s\\n]*{[\\s\\n]*if[\\s\\n]*\\(!data\\)[\\s\\n]*{[\\s\\n]*return;[\\s\\n]*}[\\s\\n]*return[\\s\\n]*\\([\\s\\n]*<${props.relationNamePascalCased}[\\s\\n]*isServer={isServer}[\\s\\n]*variant="admin-table"[\\s\\n]*apiProps={{[\\s\\n]*params:[\\s\\n]*{[\\s\\n]*filters:[\\s\\n]*{[\\s\\n]*and:[\\s\\n]*\\[[\\s\\n]*{[\\s\\n]*column:[\\s\\n]*"${currentModelNameStyled.propertyCased.base}Id",[\\s\\n]*method:[\\s\\n]*"eq",[\\s\\n]*value:[\\s\\n]*data\\.id,[\\s\\n]*},[\\s\\n]*\\],[\\s\\n]*},[\\s\\n]*},[\\s\\n]*}}[\\s\\n]*\\/>[\\s\\n]*\\);[\\s\\n]*}}`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
