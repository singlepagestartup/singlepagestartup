import { generateFiles, offsetFromRoot, Tree, updateJson } from "@nx/devkit";
import {
  Coder as ModelsCoder,
  IGeneratorProps as IModelsCoderGeneratorProps,
} from "./models/Coder";
import { Coder as ModuleCoder } from "../Coder";
import { IEditFieldProps } from "./models/[model]/backend/schema/table/Coder";
import {
  Coder as RelationsCoder,
  IGeneratorProps as IRelationsCoderGeneratorProps,
} from "./relations/Coder";
import {
  Coder as BackendCoder,
  IGeneratorProps as IBackendCoderGeneratorProps,
} from "./backend/Coder";
import {
  Coder as FrontendCoder,
  IGeneratorProps as IFrontendCoderGeneratorProps,
} from "./frontend/Coder";
import { util as getNameStyles } from "../../../../utils/get-name-styles";

export type IGeneratorProps = {
  name: Coder["name"];
  models?: IModelsCoderGeneratorProps[];
  relations?: IRelationsCoderGeneratorProps[];
  backend?: IBackendCoderGeneratorProps;
  frontend?: IFrontendCoderGeneratorProps;
};

/**
 * Module Coder
 *
 * Can work in specific module
 */
export class Coder {
  name: string;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  tree: Tree;
  parent: ModuleCoder;
  nameStyles: ReturnType<typeof getNameStyles>;
  project: {
    models: ModelsCoder[];
    relations: RelationsCoder[];
    backend: BackendCoder;
    frontend: FrontendCoder;
  } = {
    models: [],
    relations: [],
    backend: {} as BackendCoder,
    frontend: {} as FrontendCoder,
  };

  constructor(
    props: {
      tree: Tree;
      parent: ModuleCoder;
    } & IGeneratorProps,
  ) {
    this.baseName = `${props.parent.baseName}/${props.name}`;
    this.baseDirectory = `${props.parent.baseDirectory}/${props.name}`;
    this.name = props.name;
    this.tree = props.tree;
    this.parent = props.parent;
    this.absoluteName = `${props.parent.absoluteName}/${props.name}`;
    this.nameStyles = getNameStyles({ name: this.name });

    this.project.backend = new BackendCoder({
      ...props.backend,
      tree: this.tree,
      parent: this,
    });

    this.project.frontend = new FrontendCoder({
      ...props.frontend,
      tree: this.tree,
      parent: this,
    });

    props.models?.forEach((model) => {
      this.project.models.push(
        new ModelsCoder({
          ...model,
          tree: this.tree,
          parent: this,
        }),
      );
    });

    props.relations?.forEach((relation) => {
      this.project.relations.push(
        new RelationsCoder({
          ...relation,
          tree: this.tree,
          parent: this,
        }),
      );
    });
  }

  async create() {
    await this.project.backend.create();
    await this.project.backend.attach();

    // await this.project.frontend.create();

    // for (const model of this.project.models) {
    //   await model.create();
    // }

    // for (const relation of this.project.relations) {
    //   await relation.create();
    // }

    // const offsetFromRootProject = offsetFromRoot(this.baseDirectory);

    // generateFiles(this.tree, `${__dirname}/files`, this.baseDirectory, {
    //   template: "",
    //   lib_name: this.baseName,
    //   name_pascal_cased: this.nameStyles.pascalCased.base,
    //   offset_from_root: offsetFromRootProject,
    //   directory: this.baseDirectory,
    // });

    await this.attach();
  }

  async attach() {
    updateJson(this.tree, "tsconfig.base.json", (json) => {
      const updatedJson = {
        ...json,
        compilerOptions: {
          ...json.compilerOptions,
          paths: {
            ...json.compilerOptions.paths,
            [this.baseName + "/*"]: ["libs/modules/" + this.name + "/*"],
          },
        },
      };

      return updatedJson;
    });
  }

  async migrate(props: { version: string }) {
    for (const model of this.project.models) {
      await model.migrate(props);
    }

    for (const relation of this.project.relations) {
      await relation.migrate(props);
    }

    await this.project.backend.migrate(props);
    await this.project.frontend.migrate(props);
  }

  async remove() {
    for (const relation of this.project.relations) {
      await relation.remove();
    }

    for (const model of this.project.models) {
      await model.remove();
    }

    await this.project.frontend.remove();
    await this.project.backend.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.models[0].addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.models[0].removeField(props);
  }
}
