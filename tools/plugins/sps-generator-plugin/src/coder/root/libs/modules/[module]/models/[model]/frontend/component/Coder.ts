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

  constructor(props: { parent: FrontendCoder; tree: Tree } & IGeneratorProps) {
    this.name = "component";
    this.baseName = `${props.parent.baseName}-component`;
    this.baseDirectory = `${props.parent.baseDirectory}/component`;
    this.absoluteName = `${props.parent.absoluteName}/component`;
    this.tree = props.tree;
    this.parent = props.parent;
    this.variants = props.variants ?? [];
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
  }

  async createVariant(props: IVariantProps) {
    const moduleName = this.parent.parent.parent.parent.name;
    const modelName = this.parent.parent.name;

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
        sdk_model_import_path: sdkModelImportPath,
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
    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
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
