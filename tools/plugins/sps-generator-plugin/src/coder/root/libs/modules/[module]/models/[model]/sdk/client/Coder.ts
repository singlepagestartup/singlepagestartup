import {
  ProjectConfiguration,
  Tree,
  getProjects,
  offsetFromRoot,
} from "@nx/devkit";
import { Coder as ContractsCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../../utils/create-sps-ts-library";
import * as nxWorkspace from "@nx/workspace";
import * as path from "path";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  name: string;
  parent: ContractsCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  project?: ProjectConfiguration;
  absoluteName: string;
  importPath: string;

  constructor(props: { parent: ContractsCoder; tree: Tree } & IGeneratorProps) {
    this.name = "extended";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${props.parent.baseName}-extended`;
    this.baseDirectory = `${props.parent.baseDirectory}/extended`;
    this.absoluteName = `${props.parent.absoluteName}/extended`;

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

    const rootContractsImportPath = this.parent.project.root.absoluteName;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        root_contracts_import_path: rootContractsImportPath,
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
