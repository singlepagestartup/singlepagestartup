import {
  Coder as RepositoryCoder,
  IGeneratorProps as IRepositoryCoderGeneratorProps,
} from "./repository/Coder";
import { Tree } from "@nx/devkit";
import { Coder as ModelCoder } from "../Coder";
import {
  Coder as AppCoder,
  IGeneratorProps as IAppCoderGeneratorProps,
} from "./app/Coder";
import { IEditFieldProps } from "./repository/database/Coder";

export type IGeneratorProps = {
  app?: IAppCoderGeneratorProps;
  repository?: IRepositoryCoderGeneratorProps;
};

export class Coder {
  parent: ModelCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  name: string;
  project: {
    app: AppCoder;
    repository: RepositoryCoder;
  } = {} as {
    app: AppCoder;
    repository: RepositoryCoder;
  };

  constructor(props: { parent: ModelCoder; tree: Tree } & IGeneratorProps) {
    this.name = "backend";
    this.baseName = `${props.parent.baseName}-backend`;
    this.baseDirectory = `${props.parent.baseDirectory}/backend`;
    this.absoluteName = `${props.parent.absoluteName}/backend`;
    this.tree = props.tree;
    this.parent = props.parent;

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

  async migrate(props: { version: string }) {
    await this.project.repository.migrate(props);
    await this.project.app.migrate(props);
  }

  async create() {
    await this.project.repository.create();
    await this.project.app.create();
  }

  async remove() {
    await this.project.app.remove();
    await this.project.repository.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.repository.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.repository.removeField(props);
  }
}
