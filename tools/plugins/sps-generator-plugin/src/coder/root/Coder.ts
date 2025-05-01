import { Tree } from "@nx/devkit";
import {
  Coder as LibsCoder,
  IGeneratorProps as ILibsCoderGeneratorProps,
} from "./libs/Coder";
import { IEditFieldProps } from "./libs/modules/[module]/models/[model]/backend/repository/database/Coder";

export type IGeneratorProps = {
  libs: ILibsCoderGeneratorProps;
};

/**
 * Root Coder
 *
 * Can create apps
 */
export class Coder {
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  name: string;
  project: {
    libs: LibsCoder;
  } = {} as {
    libs: LibsCoder;
  };

  constructor(
    props: {
      tree: Tree;
    } & IGeneratorProps,
  ) {
    this.name = "root";
    this.tree = props.tree;
    this.baseName = "@sps";
    this.baseDirectory = "";

    this.project.libs = new LibsCoder({
      ...props.libs,
      tree: this.tree,
      parent: this,
    });
  }

  async create() {
    await this.project.libs.create();
  }

  async migrate(props: { version: string }) {
    await this.project.libs.migrate(props);
  }

  async remove() {
    await this.project.libs.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.libs.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.libs.removeField(props);
  }
}
