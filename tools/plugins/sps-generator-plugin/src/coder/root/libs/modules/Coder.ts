import { Tree } from "@nx/devkit";
import {
  Coder as ModuleCoder,
  IGeneratorProps as IModuleCoderGeneratorProps,
} from "./[module]/Coder";
import { Coder as ModulesCoder } from "../Coder";
import { IEditFieldProps } from "./[module]/models/[model]/backend/schema/table/Coder";

export type IGeneratorProps = {
  module: IModuleCoderGeneratorProps;
};

/**
 * Modules Coder
 *
 * Can create modules
 */
export class Coder {
  tree: Tree;
  parent: ModulesCoder;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  type: "modules" | "providers" | "shared";
  name: string;
  project: {
    module: ModuleCoder;
  } = {} as {
    module: ModuleCoder;
  };

  constructor(
    props: {
      tree: Tree;
      parent: ModulesCoder;
      type: "modules" | "providers" | "shared";
    } & IGeneratorProps,
  ) {
    this.baseName = `${props.parent.baseName}`;
    this.baseDirectory = `${props.parent.baseDirectory}/${props.type}`;
    this.name = props.type;
    this.tree = props.tree;
    this.parent = props.parent;
    this.absoluteName = `${props.parent.baseName}`;
    this.type = "modules";

    this.project.module = new ModuleCoder({
      ...props.module,
      tree: this.tree,
      parent: this,
    });
  }

  async create() {
    await this.project.module.create();
  }

  async migrate(props: { version: string }) {
    await this.project.module?.migrate(props);
  }

  async remove() {
    await this.project.module.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.module.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.module.removeField(props);
  }
}
