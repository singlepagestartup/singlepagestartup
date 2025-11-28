import { Tree } from "@nx/devkit";
import { Coder as RelationsCoder } from "../Coder";
import {
  Coder as BackendCoder,
  IGeneratorProps as IBackendCoderGeneratorProps,
} from "./backend/Coder";
import {
  Coder as SdkCoder,
  IGeneratorProps as ISdkCoderGeneratorProps,
} from "./sdk/Coder";
import {
  Coder as FrontendCoder,
  IGeneratorProps as IFrontendCoderGeneratorProps,
} from "./frontend/Coder";
import { util as getNameStyles } from "../../../../../../utils/get-name-styles";

export type IGeneratorProps = {
  name: string;
  leftModelIsExternal?: boolean;
  rightModelIsExternal?: boolean;
  frontend?: IFrontendCoderGeneratorProps;
  backend?: IBackendCoderGeneratorProps;
  sdk?: ISdkCoderGeneratorProps;
  models: {
    name: string;
    module: string;
  }[];
};

/**
 * Relation Coder
 */
export class Coder {
  tree: Tree;
  parent: RelationsCoder;
  baseName: string;
  baseDirectory: string;
  absoluteName: string;
  name: string;
  nameStyles: ReturnType<typeof getNameStyles>;
  project: {
    backend: BackendCoder;
    sdk: SdkCoder;
    frontend: FrontendCoder;
  } = {} as {
    backend: BackendCoder;
    sdk: SdkCoder;
    frontend: FrontendCoder;
  };
  models: {
    name: string;
    module: string;
  }[];

  constructor(props: { tree: Tree; parent: RelationsCoder } & IGeneratorProps) {
    this.tree = props.tree;
    this.parent = props.parent;
    this.name = props.name;

    this.nameStyles = getNameStyles({ name: this.name });

    this.baseName = `${this.parent.baseName}-${this.name}`;
    this.baseDirectory = `${this.parent.baseDirectory}/${this.name}`;
    this.absoluteName = `${this.parent.absoluteName}/${this.name}`;

    this.models = props.models;

    this.project.backend = new BackendCoder({
      ...props.backend,
      tree: this.tree,
      parent: this,
    });

    this.project.sdk = new SdkCoder({
      ...props.sdk,
      tree: this.tree,
      parent: this,
    });

    this.project.frontend = new FrontendCoder({
      ...props.frontend,
      tree: this.tree,
      parent: this,
    });
  }

  async create() {
    await this.project.backend.create();
    await this.project.sdk.create();
    await this.project.frontend.create();
  }

  async migrate(props: { version: string }) {
    await this.project.backend.migrate(props);
    await this.project.sdk.migrate(props);
    await this.project.frontend.migrate(props);
  }

  async remove() {
    await this.project.frontend.remove();
    await this.project.sdk.remove();
    await this.project.backend.remove();
  }
}
