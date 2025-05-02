import {
  Tree,
  generateFiles,
  offsetFromRoot,
  updateJson,
  updateProjectConfiguration,
} from "@nx/devkit";
import { Migrator as ParentMigrator } from "../Migrator";
import path from "path";
import { util as visitAllFiles } from "../../../../../../../../../../../../utils/visit-all-files";

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

    const rootFiles = this.parent.coder.tree.children(baseDirectory);

    for (const rootFile of rootFiles) {
      const pathToFile = `${baseDirectory}/${rootFile}`;
      const isFile = this.parent.coder.tree.isFile(pathToFile);

      if (isFile) {
        this.parent.coder.tree.delete(pathToFile);
      }
    }

    const leftModelSchemaTableOldImportPath = `${this.parent.coder.parent.parent.parent.parent.parent.project.models[0].project.model.project.backend.project.schema.project.table.baseName}`;
    const leftModelSchemaTableNewImportPath = `${this.parent.coder.parent.parent.parent.parent.parent.project.models[0].project.model.project.backend.project.schema.project.table.absoluteName}`;
    const rightModelSchemaTableOldImportPath = `${this.parent.coder.parent.parent.parent.parent.parent.project.models[1].project.model.project.backend.project.schema.project.table.baseName}`;
    const rightModelSchemaTableNewImportPath = `${this.parent.coder.parent.parent.parent.parent.parent.project.models[1].project.model.project.backend.project.schema.project.table.absoluteName}`;

    const moduleRootSchema =
      this.parent.coder.parent.parent.parent.parent.parent.project.backend
        .project.schema.project.root.baseDirectory;

    const oldImportPath = `${this.parent.coder.baseName}`;
    const newImportPath = `${this.parent.coder.absoluteName}`;

    const moduleRoot = this.parent.coder.tree
      .read(`${moduleRootSchema}/src/lib/index.ts`)
      ?.toString("utf8");

    const newModuleRoot = moduleRoot?.replace(
      new RegExp(oldImportPath, "g"),
      newImportPath,
    );

    if (newModuleRoot) {
      this.parent.coder.tree.write(
        `${moduleRootSchema}/src/lib/index.ts`,
        newModuleRoot,
      );
    }

    const files = visitAllFiles(
      this.parent.coder.tree,
      baseDirectory,
      (filePath) => {
        const file = this.parent.coder.tree.read(filePath)?.toString("utf8");

        const newFile = file
          ?.replace(
            new RegExp(leftModelSchemaTableOldImportPath, "g"),
            leftModelSchemaTableNewImportPath,
          )
          ?.replace(
            new RegExp(rightModelSchemaTableOldImportPath, "g"),
            rightModelSchemaTableNewImportPath,
          );

        if (newFile) {
          this.parent.coder.tree.write(filePath, newFile);
        }
      },
    );

    generateFiles(
      this.parent.coder.tree,
      path.join(__dirname, `files`),
      baseDirectory,
      {
        template: "",
        lib_name: baseName,
        offset_from_root: offsetFromRootProject,
      },
    );

    updateJson(this.parent.coder.tree, `tsconfig.base.json`, (json) => {
      const updatedJson = { ...json };
      const project = updatedJson.compilerOptions.paths[`${baseName}`];

      delete updatedJson.compilerOptions.paths[`${baseName}`];

      return updatedJson;
    });
  }
}
