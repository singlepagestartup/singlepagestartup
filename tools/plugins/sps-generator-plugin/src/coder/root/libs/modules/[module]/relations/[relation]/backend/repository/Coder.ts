import { Tree } from "@nx/devkit";
import { Coder as BackendCoder } from "../Coder";
import {
  Coder as DatabaseCoder,
  IGeneratorProps as IDatabaseCoderGeneratorProps,
} from "./database/Coder";

export type IGeneratorProps = {
  database?: IDatabaseCoderGeneratorProps;
};

/**
 * Backend Coder
 */
export class Coder {
  tree: Tree;
  parent: BackendCoder;
  baseName: string;
  baseDirectory: string;
  name: string;
  absoluteName: string;
  project: {
    database: DatabaseCoder;
  };

  constructor(props: { tree: Tree; parent: BackendCoder } & IGeneratorProps) {
    this.name = "repository";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${this.parent.baseName}-repository`;
    this.baseDirectory = `${this.parent.baseDirectory}/repository`;
    this.absoluteName = `${this.parent.absoluteName}/repository`;

    const database = new DatabaseCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      database,
    };
  }

  async migrate(props: { version: string }) {
    await this.project.database.migrate(props);
  }

  async create() {
    await this.project.database.create();
  }

  async remove() {
    await this.project.database.remove();
  }
}
