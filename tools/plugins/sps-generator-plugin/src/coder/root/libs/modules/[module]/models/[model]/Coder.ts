import { Tree } from "@nx/devkit";
import { Coder as ModelsCoder } from "../Coder";
import {
  Coder as BackendCoder,
  IGeneratorProps as IBackendCoderGeneratorProps,
} from "./backend/Coder";
import { IEditFieldProps } from "./backend/schema/table/Coder";
import {
  Coder as FrontendCoder,
  IGeneratorProps as IFrontendCoderGeneratorProps,
} from "./frontend/Coder";
import {
  Coder as ContractsCoder,
  IGeneratorProps as IContractsCoderGeneratorProps,
} from "./contracts/Coder";
import { util as getNameStyles } from "../../../../../../utils/get-name-styles";

export type IGeneratorProps = {
  name: Coder["name"];
  isExternal?: boolean;
  frontend?: IFrontendCoderGeneratorProps;
  backend?: IBackendCoderGeneratorProps;
  contracts?: IContractsCoderGeneratorProps;
};

/**
 * Model coder
 */
export class Coder {
  name: string;
  tree: Tree;
  parent: ModelsCoder;
  baseName: string;
  isExternal: boolean = false;
  baseDirectory: string;
  nameStyles: ReturnType<typeof getNameStyles>;
  project: {
    backend: BackendCoder;
    contracts: ContractsCoder;
    frontend: FrontendCoder;
  } = {} as {
    backend: BackendCoder;
    contracts: ContractsCoder;
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
    this.name = props.name;
    this.nameStyles = getNameStyles({ name: props.name });
    this.tree = props.tree;

    this.project.backend = new BackendCoder({
      ...props.backend,
      tree: this.tree,
      parent: this,
    });

    this.project.contracts = new ContractsCoder({
      ...props.contracts,
      tree: this.tree,
      parent: this,
    });

    this.project.frontend = new FrontendCoder({
      ...props.frontend,
      tree: this.tree,
      parent: this,
    });
  }

  async update() {
    await this.project.contracts.update();
    // await this.project.backend.update();
    // await this.project.frontend.update();
  }

  async create() {
    await this.project.contracts.create();
    await this.project.backend.create();
    await this.project.frontend.create();

    const createAdmin = false;
    // const createAdmin = true;

    const requiredVariants = ["default"];
    for (const variant of requiredVariants) {
      await this.project.frontend.createVariant({
        variantName: variant,
        variantLevel: "sps-lite",
      });
    }

    const adminVariantsVariants = [
      "admin-form",
      "admin-form-inputs",
      "admin-select-input",
      "admin-table",
      "admin-table-row",
    ];
    if (createAdmin) {
      for (const variant of adminVariantsVariants) {
        await this.project.frontend.createVariant({
          variantName: variant,
          variantLevel: "sps-lite",
          templateName: variant,
        });
      }
    }
  }

  async remove() {
    await this.project.frontend.removeVariant({
      variantName: "default",
      variantLevel: "sps-lite",
    });

    await this.project.frontend.remove();
    await this.project.backend.remove();
    await this.project.contracts.remove();
  }

  async addField(props: IEditFieldProps) {
    await this.project.backend.addField(props);
  }

  async removeField(props: IEditFieldProps) {
    await this.project.backend.removeField(props);
  }

  async createRelation() {
    await this.project.backend.createRelation();
  }

  async removeRelation() {
    await this.project.backend.removeRelation();
  }

  async createModelFrontendComponentVariant(props: {
    variantName: string;
    variantLevel: string;
    templateName?: string;
  }) {
    await this.project.frontend.createVariant(props);
  }

  async removeModelFrontendComponentVariant(props: {
    variantName: string;
    variantLevel: string;
  }) {
    await this.project.frontend.removeVariant(props);
  }

  async createBackendVariant(props: {
    variantName: string;
    variantLevel: string;
  }) {
    await this.project.backend.createVariant(props);
  }

  async removeBackendVariant(props: {
    variantName: string;
    variantLevel: string;
  }) {
    await this.project.backend.removeVariant(props);
  }
}
