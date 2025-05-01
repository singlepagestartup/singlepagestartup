import { Tree } from "@nx/devkit";
import {
  IEditFieldProps,
  Coder as DatabaseCoder,
  IGeneratorProps as IDatabaseCoderGeneratorProps,
} from "./database/Coder";
import { Coder as BackendCoder } from "../Coder";

export type IGeneratorProps = {
  database?: IDatabaseCoderGeneratorProps;
};

export class Coder {
  parent: BackendCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  name: string;
  absoluteName: string;
  project: {
    database: DatabaseCoder;
  } = {} as {
    database: DatabaseCoder;
  };

  constructor(props: { parent: BackendCoder; tree: Tree } & IGeneratorProps) {
    this.name = "repository";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${props.parent.baseName}-repository`;
    this.baseDirectory = `${props.parent.baseDirectory}/repository`;
    this.absoluteName = `${props.parent.absoluteName}/repository`;

    this.project.database = new DatabaseCoder({
      parent: this,
      tree: this.tree,
    });
  }

  async create() {
    await this.project.database.create();
  }

  async migrate(props: { version: string }) {
    await this.project.database.migrate(props);
  }

  async remove() {
    await this.project.database.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.database.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.database.removeField(props);
  }
}
