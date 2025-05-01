import { Coder as SdkCoder } from "../Coder";
import { Tree } from "@nx/devkit";
import {
  Coder as ModelCoder,
  IGeneratorProps as IModelCoderGeneratorProps,
} from "./model/Coder";
import {
  Coder as ClientCoder,
  IGeneratorProps as IClientCoderGeneratorProps,
} from "./client/Coder";

export type IGeneratorProps = {
  model?: IModelCoderGeneratorProps;
  client?: IClientCoderGeneratorProps;
};

export class Coder {
  name: string;
  parent: SdkCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project: {
    client: ClientCoder;
    model: ModelCoder;
  };

  constructor(props: { parent: SdkCoder; tree: Tree } & IGeneratorProps) {
    this.name = "sdk";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseDirectory = `${props.parent.baseDirectory}/sdk`;
    this.baseName = `${props.parent.baseName}-sdk`;
    this.absoluteName = `${props.parent.absoluteName}/sdk`;

    const model = new ModelCoder({
      tree: this.tree,
      parent: this,
    });

    const client = new ClientCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      model,
      client,
    };
  }

  async migrate(props: { version: string }) {
    await this.project.model.migrate(props);
    await this.project.client.migrate(props);
  }

  async create() {
    await this.project.model.create();
    // await this.project.client.create();
  }

  async remove() {
    // await this.project.client.remove();
    await this.project.model.remove();
  }
}
