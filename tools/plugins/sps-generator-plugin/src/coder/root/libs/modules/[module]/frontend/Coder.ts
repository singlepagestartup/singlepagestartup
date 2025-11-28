import { Tree } from "@nx/devkit";
import { Coder as ModuleCoder } from "../Coder";
import {
  Coder as ComponentCoder,
  IGeneratorProps as IComponentCoderGeneratorProps,
} from "./component/Coder";

export type IGeneratorProps = {
  component?: IComponentCoderGeneratorProps;
};

export class Coder {
  parent: ModuleCoder;
  tree: Tree;
  name: string;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  project: {
    component: ComponentCoder;
  };

  constructor(props: { tree: Tree; parent: ModuleCoder } & IGeneratorProps) {
    this.name = "frontend";
    this.tree = props.tree;
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-frontend`;
    this.baseDirectory = `${this.parent.baseDirectory}/frontend`;
    this.absoluteName = `${this.parent.absoluteName}/frontend`;

    const component = new ComponentCoder({
      tree: this.tree,
      parent: this,
    });

    this.project = {
      component,
    };
  }

  async migrate(props: { version: string }) {
    await this.project.component.migrate(props);
  }

  async create() {
    await this.project.component.create();
  }

  async remove() {
    await this.project.component.remove();
  }
}
