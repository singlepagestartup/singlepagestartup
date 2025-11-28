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
import {
  Coder as ServerCoder,
  IGeneratorProps as IServerCoderGeneratorProps,
} from "./server/Coder";

export type IGeneratorProps = {
  model?: IModelCoderGeneratorProps;
  client?: IClientCoderGeneratorProps;
  server?: IServerCoderGeneratorProps;
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
    server: ServerCoder;
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

    const server = new ServerCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      model,
      client,
      server,
    };
  }

  async migrate(props: { version: string }) {
    await this.project.model.migrate(props);
    await this.project.server.migrate(props);
    await this.project.client.migrate(props);
  }

  async create() {
    await this.project.model.create();
    await this.project.server.create();
    await this.project.client.create();
  }

  async remove() {
    await this.project.client.remove();
    await this.project.server.remove();
    await this.project.model.remove();
  }
}
