import {
  generateFiles,
  offsetFromRoot,
  updateJson,
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

    const rootFiles = this.parent.coder.tree.children(baseDirectory);

    for (const rootFile of rootFiles) {
      const pathToFile = `${baseDirectory}/${rootFile}`;
      const isFile = this.parent.coder.tree.isFile(pathToFile);

      if (isFile) {
        this.parent.coder.tree.delete(pathToFile);
      }
    }

    const oldSchemaTableImportPath = `${this.parent.coder.parent.project.table.baseName}`;
    const newSchemaTableImportPath = `${this.parent.coder.parent.project.table.absoluteName}`;

    const oldSchemaRelationsImportPath = `${this.parent.coder.parent.project.relations.project.root.baseName}`;
    const newSchemaRelationsImportPath = `${this.parent.coder.parent.project.relations.project.root.absoluteName}`;

    const oldImportPath = `${this.parent.coder.baseName}`;
    const newImportPath = `${this.parent.coder.absoluteName}`;

    const moduleRootSchema =
      this.parent.coder.parent.parent.parent.parent.parent.project.backend
        .project.schema.project.root.baseDirectory;

    const moduleRoot = this.parent.coder.tree
      .read(`${moduleRootSchema}/src/lib/index.ts`)
      .toString("utf8");

    const newModuleRoot = moduleRoot.replace(
      new RegExp(oldImportPath, "g"),
      newImportPath,
    );

    this.parent.coder.tree.write(
      `${moduleRootSchema}/src/lib/index.ts`,
      newModuleRoot,
    );

    const indexFile = this.parent.coder.tree
      .read(`${baseDirectory}/src/lib/index.ts`)
      .toString("utf8");

    const newIndexFile = indexFile
      .replace(
        new RegExp(oldSchemaTableImportPath, "g"),
        newSchemaTableImportPath,
      )
      .replace(
        new RegExp(oldSchemaRelationsImportPath, "g"),
        newSchemaRelationsImportPath,
      );

    this.parent.coder.tree.write(
      `${baseDirectory}/src/lib/index.ts`,
      newIndexFile,
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
