import { Tree } from "@nx/devkit";
import { Coder as ModuleCoder } from "../Coder";
import {
  Coder as AppCoder,
  IGeneratorProps as IAppCoderGeneratorProps,
} from "./app/Coder";

export type IGeneratorProps = {
  app?: IAppCoderGeneratorProps;
};

export class Coder {
  parent: ModuleCoder;
  tree: Tree;
  name: string;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project: {
    app: AppCoder;
  };

  constructor(props: { tree: Tree; parent: ModuleCoder } & IGeneratorProps) {
    this.name = "backend";
    this.tree = props.tree;
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-backend`;
    this.baseDirectory = `${this.parent.baseDirectory}/backend`;
    this.absoluteName = `${this.parent.absoluteName}/backend`;

    const app = new AppCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      app,
    };
  }

  async migrate(props: { version: string }) {
    await this.project.app.migrate(props);
  }

  async create() {
    await this.project.app.create();
  }

  async attach() {
    await this.project.app.attach();
  }

  async remove() {
    await this.project.app.remove();
  }
}
