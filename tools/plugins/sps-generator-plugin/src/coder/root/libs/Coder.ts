import { Tree } from "@nx/devkit";
import {
  Coder as ModulesCoder,
  IGeneratorProps as IModulesCoderGeneratorProps,
} from "./modules/Coder";
import { Coder as RootCoder } from "../Coder";
import { IEditFieldProps } from "./modules/[module]/models/[model]/backend/repository/database/Coder";

export type IGeneratorProps = {
  modules: IModulesCoderGeneratorProps[];
};

/**
 * Libs Coder
 *
 * Can create libs
 */
export class Coder {
  tree: Tree;
  parent: RootCoder;
  baseName: string;
  absoluteName: string;
  baseDirectory: string;
  name: string;
  project: {
    modules: ModulesCoder[];
  } = {} as {
    modules: ModulesCoder[];
  };

  constructor(
    props: {
      tree: Tree;
      parent: RootCoder;
    } & IGeneratorProps,
  ) {
    this.baseDirectory = "libs";
    this.name = "libs";
    this.baseName = `${props.parent.baseName}`;
    this.absoluteName = `${props.parent.baseName}/${this.name}`;
    this.tree = props.tree;
    this.parent = props.parent;

    this.project.modules = props.modules.map((module) => {
      return new ModulesCoder({
        ...module,
        tree: this.tree,
        parent: this,
        type: "modules",
      });
    });
  }

  async create() {
    for (const module of this.project.modules) {
      await module.create();
    }
  }

  async migrate(props: { version: string }) {
    for (const module of this.project.modules) {
      await module.migrate(props);
    }
  }

  async remove() {
    for (const module of this.project.modules) {
      await module.remove();
    }
  }

  async addField(props: IEditFieldProps) {
    for (const module of this.project.modules) {
      await module.addField(props);
    }
  }

  async removeField(props: IEditFieldProps) {
    for (const module of this.project.modules) {
      await module.removeField(props);
    }
  }
}
