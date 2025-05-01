import {
  generateFiles,
  offsetFromRoot,
  ProjectConfiguration,
  updateProjectConfiguration,
} from "@nx/devkit";
import { Migrator as ParentMigrator } from "../Migrator";
import path from "path";

export class Migrator {
  parent: ParentMigrator;

  constructor({ parent }: { parent: ParentMigrator }) {
    this.parent = parent;
  }

  async execute() {
    const baseDirectory = this.parent.coder.baseDirectory;
    const baseName = this.parent.coder.baseName;
    const offsetFromRootProject = offsetFromRoot(baseDirectory);

    const exists = this.parent.coder.tree.exists(baseDirectory);

    if (!exists) {
      throw new Error(`The directory ${baseDirectory} does not exist`);
    }

    generateFiles(
      this.parent.coder.tree,
      path.join(__dirname, "files"),
      baseDirectory,
      {
        template: "",
        lib_name: baseName,
        offset_from_root: offsetFromRootProject,
      },
    );

    this.parent.coder.tree.delete(`${baseDirectory}/tsconfig.spec.json`);

    updateProjectConfiguration(this.parent.coder.tree, baseName, {
      ...(this.parent.coder.project as ProjectConfiguration),
      targets: {
        "tsc:build": {},
      },
    });

    this.parent.coder.tree.delete(`${baseDirectory}/.babelrc`);
    this.parent.coder.tree.delete(`${baseDirectory}/.eslintrc.json`);
  }
}
