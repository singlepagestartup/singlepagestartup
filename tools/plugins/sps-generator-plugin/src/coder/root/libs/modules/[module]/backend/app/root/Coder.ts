import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import { Coder as AppCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../utils/get-name-styles";
import * as nxWorkspace from "@nx/workspace";
import path from "path";

export class Coder {
  name: string;
  parent: AppCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  project: ProjectConfiguration;
  moduleNameStyles: ReturnType<typeof getNameStyles>;

  constructor({ tree, parent }: { tree: Tree; parent: AppCoder }) {
    this.name = "root";
    this.baseName = `${parent.baseName}`;
    this.baseDirectory = `${parent.baseDirectory}/root`;
    this.tree = tree;
    this.parent = parent;

    const moduleName = this.parent.parent.parent.name;
    const moduleNameStyles = getNameStyles({ name: moduleName });
    this.moduleNameStyles = moduleNameStyles;
  }

  async create() {
    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        module_name_kebab_case: this.moduleNameStyles.kebabCased.base,
      },
    });

    const projects = getProjects(this.tree);

    this.project = projects.get(this.baseName);
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
