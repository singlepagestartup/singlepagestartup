import {
  ProjectConfiguration,
  Tree,
  getProjects,
  updateJson,
} from "@nx/devkit";
import { Coder as AppCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../utils/get-name-styles";
import * as nxWorkspace from "@nx/workspace";
import path from "path";
import { Migrator } from "./migrator/Migrator";
import { RegexCreator } from "../../../../../../../../utils/regex-utils/RegexCreator";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../utils/file-utils";

export class Coder {
  name: string;
  parent: AppCoder;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  project?: ProjectConfiguration;
  absoluteName: string;
  moduleNameStyles: ReturnType<typeof getNameStyles>;
  importBackendAppApiAsPropertyCasedAppName: ImportBackendAppApiAsPropertyCasedAppName;
  importPath: string;

  constructor({ tree, parent }: { tree: Tree; parent: AppCoder }) {
    this.name = "api";
    this.baseName = `${parent.baseName}`;
    this.baseDirectory = `${parent.baseDirectory}/api`;
    this.absoluteName = `${parent.absoluteName}/api`;
    this.importPath = this.absoluteName;
    this.tree = tree;
    this.parent = parent;

    const moduleName = this.parent.parent.parent.name;
    const moduleNameStyles = getNameStyles({ name: moduleName });
    this.moduleNameStyles = moduleNameStyles;

    const importBackendAppApiAsPropertyCasedAppName =
      new ImportBackendAppApiAsPropertyCasedAppName({
        asPropertyCasedAppName: this.moduleNameStyles.propertyCased.base,
        importPath: this.importPath,
      });
    this.importBackendAppApiAsPropertyCasedAppName =
      importBackendAppApiAsPropertyCasedAppName;

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

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        module_name_kebab_case: this.moduleNameStyles.kebabCased.base,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async attach() {
    await addToFile({
      toTop: true,
      pathToFile: "/apps/api/app.ts",
      content: this.importBackendAppApiAsPropertyCasedAppName.onCreate.content,
      tree: this.tree,
    });

    // await replaceInFile({
    //   tree: this.tree,
    //   pathToFile: moduleAppRoutesPath,
    //   regex: this.exportRoute.onCreate.regex,
    //   content: this.exportRoute.onCreate.content,
    // });
  }

  async detach() {
    await replaceInFile({
      pathToFile: "/apps/api/app.ts",
      content: this.importBackendAppApiAsPropertyCasedAppName.onRemove.content,
      regex: this.importBackendAppApiAsPropertyCasedAppName.onRemove.regex,
      tree: this.tree,
    });
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }
}

export class ImportBackendAppApiAsPropertyCasedAppName extends RegexCreator {
  constructor(props: { asPropertyCasedAppName: string; importPath: string }) {
    const place = 'export const app = new Hono().basePath("/");';
    const placeRegex = new RegExp(
      'export const app = new Hono\\(\\)\\.basePath\\("/"\\);',
    );

    const content = `import { app as ${props.asPropertyCasedAppName} } from "${props.importPath}";\n\n`;

    const contentRegex = new RegExp(
      `import { app as ${props.asPropertyCasedAppName} } from "${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      contentRegex,
      content,
      type: "prepend",
    });
  }
}
