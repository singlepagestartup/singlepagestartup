import {
  Tree,
  generateFiles,
  updateJson,
  updateProjectConfiguration,
} from "@nx/devkit";
import * as nxWorkspace from "@nx/workspace";
import { libraryGenerator as jsLibraryGenerator } from "@nx/js";

export class Coder {
  name: string;
  directory: string;

  constructor({ name, directory }: { name: string; directory: string }) {
    this.name = name;
    this.directory = directory;
  }

  async create({
    tree,
    generateFilesPath,
    templateParams,
  }: {
    tree: Tree;
    generateFilesPath?: string;
    templateParams?: { [key: string]: string };
  }) {
    await jsLibraryGenerator(tree, {
      name: this.name,
      bundler: "tsc",
      directory: this.directory,
      minimal: true,
      unitTestRunner: "none",
      strict: true,
    });

    if (generateFilesPath) {
      generateFiles(
        tree,
        generateFilesPath,
        this.directory,
        templateParams || {},
      );
    } else {
      generateFiles(tree, `${__dirname}/files`, this.directory, {});
    }

    updateProjectConfiguration(tree, this.name, {
      root: this.directory,
      sourceRoot: `${this.directory}/src`,
      projectType: "library",
      tags: [],
      targets: {
        lint: {},
        build: {},
      },
    });

    updateJson(tree, `${this.directory}/tsconfig.lib.json`, (json) => {
      const compilerOptions = json.compilerOptions;
      delete compilerOptions.outDir;

      return json;
    });

    const defaultFileName = `${this.name}.ts`.replace("@sps/", "");

    updateJson(tree, `${this.directory}/package.json`, (json) => {
      delete json.type;

      return json;
    });

    tree.delete(`${this.directory}/src/lib/${defaultFileName}`);
  }

  async delete({ tree }: { tree: Tree }) {
    await nxWorkspace.removeGenerator(tree, {
      projectName: this.name,
      skipFormat: true,
      forceRemove: false,
    });
  }
}
