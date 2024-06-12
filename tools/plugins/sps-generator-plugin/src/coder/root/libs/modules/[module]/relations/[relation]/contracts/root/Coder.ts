import {
  ProjectConfiguration,
  Tree,
  getProjects,
  offsetFromRoot,
} from "@nx/devkit";
import { Coder as ContractsCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../../utils/get-name-styles";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../../utils/file-utils";
import { RegexCreator } from "../../../../../../../../../utils/regex-utils/RegexCreator";
import { space } from "../../../../../../../../../utils/regex-utils/regex-elements";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = {};

export class Coder {
  name: string;
  parent: ContractsCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  project?: ProjectConfiguration;
  importContracts: ImportContracts;
  exportNamedInterface: ExportNamedInterface;

  constructor(props: { parent: ContractsCoder; tree: Tree } & IGeneratorProps) {
    this.name = "root";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${this.parent.baseName}`;
    this.baseDirectory = `${this.parent.baseDirectory}/root`;

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async update() {
    const migrator = new Migrator({
      coder: this,
    });

    const version = "0.0.156";
    await migrator.execute({ version });
  }

  async setReplacers() {
    this.importContracts = new ImportContracts({
      libName: this.baseName,
      relationNamePascalCased: getNameStyles({
        name: this.name,
      }).pascalCased.base,
    });
    this.exportNamedInterface = new ExportNamedInterface({
      relationNamePropertyCased: getNameStyles({
        name: this.name,
      }).propertyCased.base,
      relationNamePascalCased: getNameStyles({
        name: this.name,
      }).pascalCased.base,
    });
  }

  async attach() {
    await this.setReplacers();

    const models = this.parent.parent.parent.parent.project.models;

    for (const model of models) {
      const levelContractsPath = path.join(
        model.project.model.project.contracts.project.extended.baseDirectory,
        "/src/lib/interfaces/sps-lite.ts",
      );

      await addToFile({
        toTop: true,
        pathToFile: levelContractsPath,
        content: this.importContracts.onCreate.content,
        tree: this.tree,
      });

      await replaceInFile({
        tree: this.tree,
        pathToFile: levelContractsPath,
        regex: this.exportNamedInterface.onCreate.regex,
        content: this.exportNamedInterface.onCreate.content,
      });
    }
  }

  async detach() {
    await this.setReplacers();

    const models = this.parent.parent.parent.parent.project.models;

    for (const model of models) {
      const levelContractsPath = path.join(
        model.project.model.project.contracts.project.extended.baseDirectory,
        "/src/lib/interfaces/sps-lite.ts",
      );

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: levelContractsPath,
          regex: this.exportNamedInterface.onRemove.regex,
          content: "",
        });
      } catch (error) {
        if (!error.message.includes(`No expected value`)) {
          throw error;
        }
      }

      try {
        await replaceInFile({
          tree: this.tree,
          pathToFile: levelContractsPath,
          regex: this.importContracts.onRemove.regex,
          content: "",
        });
      } catch (error) {
        if (!error.message.includes(`No expected value`)) {
          throw error;
        }
      }
    }
  }

  async create() {
    if (this.project) {
      return;
    }

    const offsetFromRootProject = offsetFromRoot(this.baseDirectory);

    const leftModelName =
      this.parent.parent.parent.parent.project.models[0].project.model.name;
    const rightModelName =
      this.parent.parent.parent.parent.project.models[1].project.model.name;

    const leftModelIsExternal =
      this.parent.parent.parent.parent.project.models[0].project.model
        .isExternal;
    const rightModelIsExternal =
      this.parent.parent.parent.parent.project.models[1].project.model
        .isExternal;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        offset_from_root: offsetFromRootProject,
        left_model_is_external: leftModelIsExternal,
        left_model_name_property_cased: getNameStyles({ name: leftModelName })
          .propertyCased.base,
        right_model_is_external: rightModelIsExternal,
        right_model_name_property_cased: getNameStyles({ name: rightModelName })
          .propertyCased.base,
      },
    });

    await this.attach();

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    await this.detach();

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }
}

export class ImportContracts extends RegexCreator {
  constructor({
    libName,
    relationNamePascalCased,
  }: {
    libName: string;
    relationNamePascalCased: string;
  }) {
    const place = ``;
    const placeRegex = new RegExp(``);

    const content = `import { IRelation as I${relationNamePascalCased} } from "${libName}";`;
    const contentRegex = new RegExp(
      `import${space}{${space}IRelation${space}as${space}I${relationNamePascalCased}${space}}${space}from${space}"${libName}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ExportNamedInterface extends RegexCreator {
  constructor({
    relationNamePropertyCased,
    relationNamePascalCased,
  }: {
    relationNamePropertyCased: string;
    relationNamePascalCased: string;
  }) {
    const place = `export interface IModel extends IParentModel {`;
    const placeRegex = new RegExp(
      `export${space}interface${space}IModel${space}extends${space}IParentModel${space}{`,
    );

    const content = `${relationNamePropertyCased}: I${relationNamePascalCased}[];`;
    const contentRegex = new RegExp(
      `${relationNamePropertyCased}:${space}I${relationNamePascalCased}\\[\\];`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
