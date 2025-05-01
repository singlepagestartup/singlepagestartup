import { Tree } from "@nx/devkit";
import { Coder as ModuleCoder } from "../Coder";
import {
  Coder as ModelCoder,
  IGeneratorProps as IModelCoderGeneratorProps,
} from "./[model]/Coder";
import { IEditFieldProps } from "./[model]/backend/repository/database/Coder";

export type IGeneratorProps = {
  model: IModelCoderGeneratorProps;
};

/**
 * Models Coder
 *
 * Can create and remove models
 */
export class Coder {
  parent: ModuleCoder;
  tree: Tree;
  name: string;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project: {
    model: ModelCoder;
  } = {} as {
    model: ModelCoder;
  };

  constructor(
    props: {
      tree: Tree;
      parent: ModuleCoder;
    } & IGeneratorProps,
  ) {
    this.name = "models";
    this.baseName = `${props.parent.baseName}-models`;
    this.baseDirectory = `${props.parent.baseDirectory}/models`;
    this.absoluteName = `${props.parent.absoluteName}/models`;
    this.tree = props.tree;
    this.parent = props.parent;

    this.project.model = new ModelCoder({
      ...props.model,
      tree: this.tree,
      parent: this,
    });
  }

  async migrate(props: { version: string }) {
    await this.project.model?.migrate(props);
  }

  async create() {
    await this.project.model.create();
  }

  async remove() {
    await this.project.model.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.model.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.model.removeField(props);
  }
}
