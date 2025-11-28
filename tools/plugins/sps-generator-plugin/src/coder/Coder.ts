import { ProjectConfiguration, Tree, getProjects } from "@nx/devkit";
import {
  Coder as RootCoder,
  IGeneratorProps as IRootCoderGeneratorProps,
} from "./root/Coder";
import { IEditFieldProps } from "./root/libs/modules/[module]/models/[model]/backend/repository/database/Coder";

export type IGeneratorProps = {
  root: IRootCoderGeneratorProps;
};

/**
 * Main coder class
 */
export class Coder {
  projects: Map<string, ProjectConfiguration>;
  tree: Tree;
  project: {
    root: RootCoder;
  } = {} as {
    root: RootCoder;
  };

  constructor(
    props: {
      tree: Tree;
    } & IGeneratorProps,
  ) {
    this.projects = getProjects(props.tree);
    this.tree = props.tree;

    this.project.root = new RootCoder({
      ...props.root,
      tree: this.tree,
    });
  }

  async create() {
    await this.project.root.create();
  }

  async migrate(props: { version: string }) {
    await this.project.root.migrate(props);
  }

  async remove() {
    await this.project.root.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.root.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.root.removeField(props);
  }
}
