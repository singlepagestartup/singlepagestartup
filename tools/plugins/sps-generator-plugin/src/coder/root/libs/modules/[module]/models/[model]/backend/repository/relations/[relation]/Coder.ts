import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import * as path from "path";
import * as nxWorkspace from "@nx/workspace";
import { util as createSpsTSLibrary } from "../../../../../../../../../../../utils/create-sps-ts-library";
import { util as getNameStyles } from "../../../../../../../../../../utils/get-name-styles";
import {
  addToFile,
  replaceInFile,
} from "../../../../../../../../../../../utils/file-utils";
import { RegexCreator } from "../../../../../../../../../../../utils/regex-utils/RegexCreator";
import {
  comma,
  space,
} from "../../../../../../../../../../../utils/regex-utils/regex-elements";
import { Coder as RelationsCoder } from "../Coder";
import { Migrator } from "./migrator/Migrator";

export type IGeneratorProps = {
  name: string;
};

export class Coder {
  parent: RelationsCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  name: string;
  absoluteName: string;
  project?: ProjectConfiguration;
  nameStyles: ReturnType<typeof getNameStyles>;
  importPopulate?: ImportPopulate;
  exportPopulate?: ExportPopulate;
  importRelation?: ImportRelation;
  exportRelation?: ExportRelation;
  importPath: string;

  constructor(props: { parent: RelationsCoder; tree: Tree } & IGeneratorProps) {
    this.parent = props.parent;
    this.tree = props.tree;
    this.name = props.name;

    this.baseName = `${props.parent.baseName}-${this.name}`;
    this.baseDirectory = `${props.parent.baseDirectory}/${this.name}`;
    this.absoluteName = `${props.parent.absoluteName}/${this.name}`;

    this.importPath = this.absoluteName;

    const nameStyles = getNameStyles({ name: this.name });

    this.nameStyles = nameStyles;

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async setReplacers() {
    this.importPopulate = new ImportPopulate({
      namePropertyCased: this.nameStyles.propertyCased.base,
      importPath: this.absoluteName,
    });
    this.exportPopulate = new ExportPopulate({
      namePropertyCased: this.nameStyles.propertyCased.base,
    });
    this.importRelation = new ImportRelation({
      leftProjectRelationNamePropertyCased: this.nameStyles.propertyCased.base,
      importPath: this.absoluteName,
    });
    this.exportRelation = new ExportRelation({
      leftProjectRelationNamePropertyCased: this.nameStyles.propertyCased.base,
    });
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

    await this.setReplacers();

    const relation =
      this.parent.parent.parent.parent.parent.parent.project.relations[0];

    const relationsSchemaImportPath =
      relation.project.relation.project.backend.project.schema.project.root
        .importPath;

    const relationsPopulatePath = path.join(
      this.parent.parent.parent.project.schema.project.relations.project.root
        .baseDirectory,
      "/src/lib/populate.ts",
    );
    const relationsSchemaPath = path.join(
      this.parent.parent.parent.project.schema.project.relations.project.root
        .baseDirectory,
      "/src/lib/schema.ts",
    );

    if (!relationsSchemaImportPath) {
      throw new Error(`No relationsSchemaProjectImportPath found`);
    }

    await createSpsTSLibrary({
      tree: this.tree,
      root: this.baseDirectory,
      name: this.baseName,
      generateFilesPath: path.join(__dirname, `files`),
      templateParams: {
        template: "",
        relation_schema_import_path: relationsSchemaImportPath,
      },
    });

    await this.attach({
      populatePath: relationsPopulatePath,
      schemaPath: relationsSchemaPath,
    });

    this.project = getProjects(this.tree).get(this.baseName);
  }

  async attach({
    populatePath,
    schemaPath,
  }: {
    populatePath: string;
    schemaPath: string;
  }) {
    await this.setReplacers();

    if (
      !this.importPopulate ||
      !this.exportPopulate ||
      !this.importRelation ||
      !this.exportRelation
    ) {
      throw new Error(`Replacers not set`);
    }

    await addToFile({
      toTop: true,
      pathToFile: populatePath,
      content: this.importPopulate.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: populatePath,
      regex: this.exportPopulate.onCreate.regex,
      content: this.exportPopulate.onCreate.content,
    });

    await addToFile({
      toTop: true,
      pathToFile: schemaPath,
      content: this.importRelation.onCreate.content,
      tree: this.tree,
    });

    await replaceInFile({
      tree: this.tree,
      pathToFile: schemaPath,
      regex: this.exportRelation.onCreate.regex,
      content: this.exportRelation.onCreate.content,
    });
  }

  async detach({
    populatePath,
    schemaPath,
  }: {
    populatePath: string;
    schemaPath: string;
  }) {
    await this.setReplacers();
    if (
      !this.importPopulate ||
      !this.exportPopulate ||
      !this.importRelation ||
      !this.exportRelation
    ) {
      throw new Error(`Replacers not set`);
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: populatePath,
        regex: this.importPopulate.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: populatePath,
        regex: this.exportPopulate.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: schemaPath,
        regex: this.importRelation.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }

    try {
      await replaceInFile({
        tree: this.tree,
        pathToFile: schemaPath,
        regex: this.exportRelation.onRemove.regex,
        content: "",
      });
    } catch (error: any) {
      if (!error.message.includes(`No expected value`)) {
        throw error;
      }
    }
  }

  async remove() {
    await this.setReplacers();

    const project = getProjects(this.tree).get(this.baseName);

    if (!project) {
      return;
    }

    const relationsPopulatePath = path.join(
      this.parent.parent.parent.project.schema.project.relations.project.root
        .baseDirectory,
      "/src/lib/populate.ts",
    );
    const relationsSchemaPath = path.join(
      this.parent.parent.parent.project.schema.project.relations.project.root
        .baseDirectory,
      "/src/lib/schema.ts",
    );

    await this.detach({
      populatePath: relationsPopulatePath,
      schemaPath: relationsSchemaPath,
    });

    await nxWorkspace.removeGenerator(this.tree, {
      projectName: this.baseName,
      skipFormat: true,
      forceRemove: true,
    });
  }
}

export class ImportPopulate extends RegexCreator {
  constructor(props: { importPath: string; namePropertyCased: string }) {
    const place = ``;
    const placeRegex = new RegExp(``);

    const content = `import { populate as ${props.namePropertyCased} } from "${props.importPath}";`;
    const contentRegex = new RegExp(
      `import${space}{${space}populate${space}as${space}${props.namePropertyCased}${space}}${space}from${space}"${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ExportPopulate extends RegexCreator {
  constructor({ namePropertyCased }: { namePropertyCased: string }) {
    const place = `return {`;
    const placeRegex = new RegExp(`return {`);

    const content = `${namePropertyCased}: ${namePropertyCased}(params),`;
    const contentRegex = new RegExp(
      `${namePropertyCased}: ${namePropertyCased}\\(params\\)${comma}${space}`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ImportRelation extends RegexCreator {
  constructor(props: {
    importPath: string;
    leftProjectRelationNamePropertyCased: string;
  }) {
    const place = ``;
    const placeRegex = new RegExp(``);

    const content = `import { relation as ${props.leftProjectRelationNamePropertyCased} } from "${props.importPath}";`;
    const contentRegex = new RegExp(
      `import${space}{${space}relation${space}as${space}${props.leftProjectRelationNamePropertyCased}${space}}${space}from${space}"${props.importPath}";`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}

export class ExportRelation extends RegexCreator {
  constructor({
    leftProjectRelationNamePropertyCased,
  }: {
    leftProjectRelationNamePropertyCased: string;
  }) {
    const place = `export const Relations = relations(Table, (helpers) => { return {`;
    const placeRegex = new RegExp(
      `export const Relations = relations\\(Table, \\(helpers\\) => {${space}return {`,
    );

    const content = `...${leftProjectRelationNamePropertyCased}(helpers),`;
    const contentRegex = new RegExp(
      `${space}\\.{3}${leftProjectRelationNamePropertyCased}\\(helpers\\)${comma}${space}`,
    );

    super({
      place,
      placeRegex,
      content,
      contentRegex,
    });
  }
}
