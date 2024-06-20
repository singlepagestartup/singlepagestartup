import { Tree } from "@nx/devkit";
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
  root: string;
  baseName: string;
  baseDirectory: string;
  tree: Tree;
  parent: ModuleCoder;
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
    await this.project.frontend.create();

    for (const model of this.project.models) {
      await model.create();
    }

    for (const relation of this.project.relations) {
      await relation.create();
    }
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
