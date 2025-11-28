import { ProjectConfiguration, Tree, getProjects, names } from "@nx/devkit";
import pluralize from "pluralize";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../../../utils/file-utils";
import * as path from "path";
import { util as createSpsTSLibrary } from "../../../../../../../../../../utils/create-sps-ts-library";
import { RegexCreator } from "../../../../../../../../../../utils/regex-utils/RegexCreator";
import { Coder as BackendCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = unknown;

export class Coder {
  parent: BackendCoder;
  tree: Tree;
  baseName: string;
  name: string;
  baseDirectory: string;
  absoluteName: string;
  project?: ProjectConfiguration;
  importApp: ImportApp;
  bindApp: BindApp;
  importPath: string;

  constructor(props: { parent: BackendCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-api`;
    this.baseDirectory = `${this.parent.baseDirectory}/api`;
    this.absoluteName = `${this.parent.absoluteName}/api`;
    this.tree = props.tree;
    this.name = "api";

    this.importPath = this.absoluteName;

    const pluralNameModelName = pluralize(
      names(this.parent.parent.parent.name).fileName,
    );

    const asPropertyModelName = names(
      this.parent.parent.parent.name,
    ).propertyName;

    this.importApp = new ImportApp({
      importPath: this.importPath,
      asPropertyModelName,
    });
    this.bindApp = new BindApp({
      route: `/${pluralNameModelName}`,
      asPropertyModelName,
    });

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

    const moduleName = this.parent.parent.parent.parent.parent.name;
    const modelName = this.parent.parent.parent.name;

    const modelRepositoryDatabaseImportPath =
      this.parent.parent.project.repository.project.database.importPath;

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, "files"),
      templateParams: {
        template: "",
        model_repository_database_import_path:
          modelRepositoryDatabaseImportPath,
        module_name: moduleName,
        model_name: modelName,
      },
    });

    this.project = getProjects(this.tree).get(this.baseName);

    await this.attach();
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
  }

  async attach() {
    const moduleAppPath =
      this.parent.parent.parent.parent.parent.project.backend.project.app
        .project.api.baseDirectory + "/src/lib/apps.ts";

    await addToFile({
      toTop: true,
      pathToFile: moduleAppPath,
      content: this.importApp.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: moduleAppPath,
      regex: this.bindApp.onCreate.regex,
      content: this.bindApp.onCreate.content,
    });
  }

  async detach() {
    const moduleAppPath =
      this.parent.parent.parent.parent.parent.project.backend.project.app
        .project.api.baseDirectory + "/src/lib/apps.ts";

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: moduleAppPath,
        regex: this.bindApp.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: moduleAppPath,
        regex: this.importApp.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes("No expected value")) {
        throw error;
      }
    }
  }
}

export class ImportApp extends RegexCreator {
  constructor({
    asPropertyModelName,
    importPath,
  }: {
    asPropertyModelName: string;
    importPath: string;
  }) {
    const place = "";
    const placeRegex = new RegExp("");

    const content = `import { app as ${asPropertyModelName} } from "${importPath}";`;

    const contentRegex = new RegExp(
      `import { app as ${asPropertyModelName} } from "${importPath}";`,
    );

    super({
      place,
      placeRegex,
      contentRegex,
      content,
    });
  }
}

export class BindApp extends RegexCreator {
  constructor({
    route,
    asPropertyModelName,
  }: {
    route: string;
    asPropertyModelName: string;
  }) {
    const place = "bindApps() {";
    const placeRegex = new RegExp("bindApps\\(\\) {");

    const content = `
    this.apps.push({
      type: "model",
      route: "${route}",
      app: ${asPropertyModelName},
    });`;

    const contentRegex = new RegExp(
      `[\\s\\n]*this\\.apps\\.push\\([\\s\\n]*{[\\s\\n]*type:[\\s]*"model",[\\s\\n]*route:[\\s]*"${route}",[\\s\\n]*app:[\\s]*${asPropertyModelName},[\\s\\n]*}\\);[\\s\\n]*`,
      "gm",
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
