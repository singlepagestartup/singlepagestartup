import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import { Coder as AppCoder } from "../Coder";
import { util as createSpsTSLibrary } from "../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../utils/get-name-styles";
import path from "path";
import { Migrator } from "./migrator/Migrator";
import { RegexCreator } from "../../../../../../../../utils/regex-utils/RegexCreator";
import { replaceInFile } from "../../../../../../../../utils/file-utils";
import {
  assertServiceModule,
  synchronizeServiceRegistries,
} from "../../../../../../../../utils/service-registries";

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
  extendApiModules: ExtendApiModules;

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

    const extendApiModules = new ExtendApiModules({
      asPropertyCasedAppName: this.moduleNameStyles.propertyCased.base,
      kebabCasedAppName: this.moduleNameStyles.kebabCased.base,
    });
    this.extendApiModules = extendApiModules;

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
    assertServiceModule(this.tree, this.moduleNameStyles.kebabCased.base);
    if (this.project) {
      synchronizeServiceRegistries(this.tree);
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

    await this.attach();
    synchronizeServiceRegistries(this.tree);
  }

  async attach() {
    await replaceInFile({
      pathToFile: "/apps/api/app.ts",
      content: this.importBackendAppApiAsPropertyCasedAppName.onCreate.content,
      regex: this.importBackendAppApiAsPropertyCasedAppName.onCreate.regex,
      tree: this.tree,
    });

    await replaceInFile({
      content: this.extendApiModules.onCreate.content,
      regex: this.extendApiModules.onCreate.regex,
      pathToFile: "/apps/api/app.ts",
      tree: this.tree,
    });
  }

  async detach() {
    await replaceInFile({
      pathToFile: "/apps/api/app.ts",
      content: this.importBackendAppApiAsPropertyCasedAppName.onRemove.content,
      regex: this.importBackendAppApiAsPropertyCasedAppName.onRemove.regex,
      tree: this.tree,
    });

    await replaceInFile({
      pathToFile: "/apps/api/app.ts",
      content: this.extendApiModules.onRemove.content,
      regex: this.extendApiModules.onRemove.regex,
      tree: this.tree,
    });
  }

  async remove() {
    await this.detach();

    if (this.tree.exists(this.baseDirectory)) {
      this.tree.delete(this.baseDirectory);
    }
    synchronizeServiceRegistries(this.tree);
  }
}

export class ImportBackendAppApiAsPropertyCasedAppName extends RegexCreator {
  constructor(props: { asPropertyCasedAppName: string; importPath: string }) {
    const place = "export const app";
    const placeRegex = /export const app\b/;

    const content = `import { moduleBootstrap as ${props.asPropertyCasedAppName}App } from "${props.importPath}/src/lib/bootstrap";\n\n`;

    const contentRegex = new RegExp(
      `import { moduleBootstrap as ${props.asPropertyCasedAppName}App } from "${props.importPath}/src/lib/bootstrap";`,
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

export class ExtendApiModules extends RegexCreator {
  constructor(props: {
    asPropertyCasedAppName: string;
    kebabCasedAppName: string;
  }) {
    const content = `\n  "${props.kebabCasedAppName}": ${props.asPropertyCasedAppName}App,`;
    super({
      place: "const apiModules = {",
      placeRegex: /const apiModules\s*=\s*\{/,
      contentRegex: new RegExp(
        `\\s*["']?${props.kebabCasedAppName}["']?:\\s*${props.asPropertyCasedAppName}App,?`,
      ),
      content,
      type: "append",
    });
  }
}
