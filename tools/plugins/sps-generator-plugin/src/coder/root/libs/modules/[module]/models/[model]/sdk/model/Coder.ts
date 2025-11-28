import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import { Coder as ContractsCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../../utils/create-sps-ts-library";
import * as path from "path";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  name: string;
  parent: ContractsCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project?: ProjectConfiguration;
  importPath: string;

  constructor(props: { parent: ContractsCoder; tree: Tree } & IGeneratorProps) {
    this.name = "model";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${props.parent.baseName}`;
    this.baseDirectory = `${props.parent.baseDirectory}/model`;
    this.absoluteName = `${props.parent.absoluteName}/model`;

    this.importPath = this.absoluteName;

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

    const modelRepositoryDatabaseImportPath =
      this.parent.parent.project.backend.project.repository.project.database
        .importPath;

    const moduleNameKebabCased = this.parent.parent.parent.parent.name;

    const modelNameKebabCasedPlural =
      this.parent.parent.nameStyles.kebabCased.pluralized;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        model_repository_database_import_path:
          modelRepositoryDatabaseImportPath,
        module_name_kebab_cased: moduleNameKebabCased,
        model_name_kebab_cased_plural: modelNameKebabCasedPlural,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async remove() {
    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }
}
