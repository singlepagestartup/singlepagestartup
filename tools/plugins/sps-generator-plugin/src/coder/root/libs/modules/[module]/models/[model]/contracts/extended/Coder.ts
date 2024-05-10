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

export class Coder {
  name: string;
  parent: ContractsCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  project: ProjectConfiguration;

  constructor({ parent, tree }: { parent: ContractsCoder; tree: Tree }) {
    this.name = "extended";
    this.parent = parent;
    this.tree = tree;
    this.baseName = `${parent.baseName}-extended`;
    this.baseDirectory = `${parent.baseDirectory}/extended`;
  }

  async init() {
    this.project = getProjects(this.tree).get(this.baseName);
  }

  async create() {
    const rootContractsImportPath = this.parent.project.root.baseName;
    const offsetFromRootProject = offsetFromRoot(this.baseDirectory);

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        offset_from_root: offsetFromRootProject,
        root_contracts_import_path: rootContractsImportPath,
      },
    });

    await this.init();
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