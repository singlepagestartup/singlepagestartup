import { Tree } from "@nx/devkit";
import { Coder as ModelsCoder } from "../Coder";
import {
  Coder as BackendCoder,
  IGeneratorProps as IBackendCoderGeneratorProps,
} from "./backend/Coder";
import { IEditFieldProps } from "./backend/repository/database/Coder";
import {
  Coder as FrontendCoder,
  IGeneratorProps as IFrontendCoderGeneratorProps,
} from "./frontend/Coder";
import {
  Coder as SdkCoder,
  IGeneratorProps as ISdkCoderGeneratorProps,
} from "./sdk/Coder";
import { util as getNameStyles } from "../../../../../../utils/get-name-styles";

export type IGeneratorProps = {
  name: Coder["name"];
  isExternal?: boolean;
  frontend?: IFrontendCoderGeneratorProps;
  backend?: IBackendCoderGeneratorProps;
  sdk?: ISdkCoderGeneratorProps;
};

/**
 * Model coder
 */
export class Coder {
  name: string;
  tree: Tree;
  parent: ModelsCoder;
  baseName: string;
  isExternal: boolean | undefined;
  absoluteName: string;
  baseDirectory: string;
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

  constructor(
    props: {
      tree: Tree;
      parent: ModelsCoder;
    } & IGeneratorProps,
  ) {
    this.parent = props.parent;
    this.baseName = `${this.parent.baseName}-${props.name}`;
    this.isExternal = props.isExternal;
    this.baseDirectory = `${this.parent.baseDirectory}/${props.name}`;
    this.absoluteName = `${this.parent.absoluteName}/${props.name}`;
    this.name = props.name;
    this.nameStyles = getNameStyles({ name: props.name });
    this.tree = props.tree;

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

  async migrate(props: { version: string }) {
    if (this.isExternal) {
      console.log(`External model "${this.name}", skipping update`);
      return;
    }

    await this.project.backend.migrate(props);
    await this.project.sdk.migrate(props);
    await this.project.frontend.migrate(props);
  }

  async create() {
    if (this.isExternal) {
      console.log(`External model "${this.name}", skipping create`);
      return;
    }

    await this.project.backend.create();
    await this.project.sdk.create();
    await this.project.frontend.create();
  }

  async remove() {
    if (this.isExternal) {
      console.log(`External model "${this.name}", skipping remove`);
      return;
    }

    await this.project.frontend.remove();
    await this.project.sdk.remove();
    await this.project.backend.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.backend.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.backend.removeField(props);
  }
}
