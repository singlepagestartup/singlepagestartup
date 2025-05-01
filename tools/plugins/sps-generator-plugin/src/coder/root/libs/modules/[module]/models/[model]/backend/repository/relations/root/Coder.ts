import { ProjectConfiguration, Tree, getProjects, names } from "@nx/devkit";
import pluralize from "pluralize";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { util as createSpsTSLibrary } from "../../../../../../../../../../../utils/create-sps-ts-library";
import { Coder as RelationsCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  parent: RelationsCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  name: string;
  project?: ProjectConfiguration;
  modelName: string;
  snakeCasePluralizedModelName: string;
  absoluteName: string;
  importPath: string;

  constructor(props: { parent: RelationsCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}`;
    this.baseDirectory = `${this.parent.baseDirectory}/root`;
    this.tree = props.tree;
    this.name = "relations";
    this.absoluteName = `${this.parent.absoluteName}/root`;

    this.importPath = this.absoluteName;

    const modelName = this.parent.parent.parent.name;
    const modelNameSplitted = names(modelName).fileName.split("-");
    const snakeCasePluralizedModelName = modelNameSplitted.reduce(
      (acc, curr, index) => {
        if (index === modelNameSplitted.length - 1) {
          const plural = pluralize(curr);
          if (index === 0) {
            return plural;
          }

          return acc + "_" + plural;
        }

        if (index === 0) {
          return curr;
        }

        return acc + "_" + curr;
      },
      "",
    );

    this.snakeCasePluralizedModelName = snakeCasePluralizedModelName;
    this.modelName = modelName;

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async migrate(props: { version: string }) {
    const migrator = new Migrator({
      coder: this,
    });

    const version = props.version as keyof typeof migrator.releases;
    await migrator.execute({ version });
  }

  async create() {
    if (this.project) {
      return;
    }

    const parentModelImportPath =
      this.parent.parent.project.table.parent.project.table.absoluteName;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        model: this.modelName,
        pluralized_model: this.snakeCasePluralizedModelName,
        parent_model_import_path: parentModelImportPath,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }
}
