import { Tree } from "@nx/devkit";
import { Coder as ModelCoder } from "../Coder";
import {
  Coder as ComponentCoder,
  IGeneratorProps as IComponentCoderGeneratorProps,
} from "./component/Coder";
import {
  Coder as ApiCoder,
  IGeneratorProps as IApiCoderGeneratorProps,
} from "./api/Coder";
import {
  Coder as ReduxCoder,
  IGeneratorProps as IReduxCoderGeneratorProps,
} from "./redux/Coder";

export type IGeneratorProps = {
  component?: IComponentCoderGeneratorProps;
  api?: IApiCoderGeneratorProps;
  redux?: IReduxCoderGeneratorProps;
};

export class Coder {
  parent: ModelCoder;
  tree: Tree;
  baseName: string;
  baseDirectory: string;
  name: string;
  project: {
    component: ComponentCoder;
    api: ApiCoder;
    redux: ReduxCoder;
  };

  constructor(props: { parent: ModelCoder; tree: Tree } & IGeneratorProps) {
    this.name = "frontend";
    this.baseName = `${props.parent.baseName}-frontend`;
    this.baseDirectory = `${props.parent.baseDirectory}/frontend`;
    this.tree = props.tree;
    this.parent = props.parent;

    const component = new ComponentCoder({
      ...props.component,
      tree: this.tree,
      parent: this,
    });

    const api = new ApiCoder({
      ...props.api,
      tree: this.tree,
      parent: this,
    });

    const redux = new ReduxCoder({
      ...props.redux,
      tree: this.tree,
      parent: this,
    });

    this.project = {
      component,
      api,
      redux,
    };
  }

  async update() {
    /**
     * That directory is just contains another packages
     * use methods from packages to update them separately
     */
    throw new Error(
      "Method not implemented, that directory just contains other packages.",
    );
  }

  async create() {
    await this.project.api.create();
    await this.project.redux.create();
    await this.project.component.create();
  }

  async remove() {
    await this.project.component.remove();
    await this.project.redux.remove();
    await this.project.api.remove();
  }

  async createVariant(props: {
    variantName: string;
    variantLevel: string;
    templateName?: string;
  }) {
    await this.project.component.createVariant(props);
  }

  async removeVariant(props: { variantName: string; variantLevel: string }) {
    await this.project.component.removeVariant(props);
  }
}
