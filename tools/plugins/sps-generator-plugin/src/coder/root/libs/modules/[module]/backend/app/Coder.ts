import { Tree } from "@nx/devkit";
import { Coder as BackendCoder } from "../Coder";
import { Coder as ApiCoder } from "./api/Coder";

export type IGeneratorProps = unknown;

export class Coder {
  name: string;
  tree: Tree;
  parent: BackendCoder;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project: {
    api: ApiCoder;
  };

  constructor(props: { tree: Tree; parent: BackendCoder } & IGeneratorProps) {
    this.name = "app";
    this.tree = props.tree;
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-app`;
    this.baseDirectory = `${this.parent.baseDirectory}/app`;
    this.absoluteName = `${this.parent.absoluteName}/app`;

    const api = new ApiCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      api,
    };
  }

  async create() {
    await this.project.api.create();
  }

  async migrate(props: { version: string }) {
    await this.project.api.migrate(props);
  }

  async remove() {
    await this.project.api.remove();
  }
}
