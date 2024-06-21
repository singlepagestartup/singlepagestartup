import {
  Tree,
  formatFiles,
  generateFiles,
  offsetFromRoot,
  updateJson,
  updateProjectConfiguration,
} from "@nx/devkit";
import { Linter } from "@nx/eslint";
import { ProjectNameAndRootFormat } from "@nx/devkit/src/generators/project-name-and-root-utils";
import {
  libraryGenerator as reactLibraryGenerator,
  SupportedStyles,
} from "@nx/react";

export const util = async ({
  root,
  name,
  tree,
  generateFilesPath,
  templateParams,
}: {
  root: string;
  name: string;
  tree: Tree;
  generateFilesPath: string;
  templateParams: {
    [key: string]: string;
  };
}) => {
  const offsetFromRootProject = offsetFromRoot(root);

  await reactLibraryGenerator(tree, {
    name,
    directory: root,
    component: false,
    linter: "none" as Linter.EsLint,
    minimal: true,
    style: "none" as SupportedStyles,
    projectNameAndRootFormat: "as-provided" as ProjectNameAndRootFormat,
    strict: true,
    unitTestRunner: "none",
  });

  updateProjectConfiguration(tree, name, {
    root,
    sourceRoot: `${root}/src`,
    projectType: "library",
    tags: [],
    targets: {
      "tsc:build": {},
    },
  });

  generateFiles(tree, generateFilesPath, root, {
    ...templateParams,
    offset_from_root: offsetFromRoot(root),
    lib_name: name,
  });

  generateFiles(tree, `${__dirname}/files`, root, {
    template: "",
    lib_name: name,
    offset_from_root: offsetFromRootProject,
  });

  tree.delete(`${root}/.babelrc`);
  tree.delete(`${root}/.eslintrc.json`);
  tree.delete(`${root}/jest.config.ts`);
  tree.delete(`${root}/tsconfig.lib.json`);
  tree.delete(`${root}/tsconfig.spec.json`);
  tree.delete(`${root}/tsconfig.json`);
  tree.delete(`${root}/package.json`);
  tree.delete(`${root}/project.json`);
  tree.delete(`${root}/README.md`);

  await formatFiles(tree);
};
