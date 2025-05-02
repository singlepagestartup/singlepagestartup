import { Tree } from "@nx/devkit";
import { Coder as RelationCoder } from "../Coder";
import {
  Coder as RepositoryCoder,
  IGeneratorProps as IRepositoryCoderGeneratorProps,
} from "./repository/Coder";
import {
  Coder as AppCoder,
  IGeneratorProps as IAppCoderGeneratorProps,
} from "./app/Coder";

export type IGeneratorProps = {
  repository?: IRepositoryCoderGeneratorProps;
  app?: IAppCoderGeneratorProps;
};

/**
 * Backend Coder
 */
export class Coder {
  tree: Tree;
  parent: RelationCoder;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  name: string;
  project: {
    repository: RepositoryCoder;
    app: AppCoder;
  } = {} as {
    repository: RepositoryCoder;
    app: AppCoder;
  };

  constructor(props: { tree: Tree; parent: RelationCoder } & IGeneratorProps) {
    this.name = "backend";
    this.parent = props.parent;
    this.tree = props.tree;
    this.baseName = `${this.parent.baseName}-backend`;
    this.baseDirectory = `${this.parent.baseDirectory}/backend`;
    this.absoluteName = `${this.parent.absoluteName}/backend`;

    this.project.repository = new RepositoryCoder({
      ...props.repository,
      tree: this.tree,
      parent: this,
    });

    this.project.app = new AppCoder({
      tree: this.tree,
      parent: this,
    });
  }

  async create() {
    await this.project.repository.create();
    // await this.project.app.create();
  }

  async migrate(props: { version: string }) {
    await this.project.repository.migrate(props);
    await this.project.app.migrate(props);
  }

  async remove() {
    // await this.project.app.remove();
    await this.project.repository.remove();
  }
}
