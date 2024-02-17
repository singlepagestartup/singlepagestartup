import {
  IModel as IParentModel,
  variants as parentVariants,
} from "@sps/sps-website-builder-layout-contracts";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-website-builder-layout-contracts-extended";

export const variants = [...parentVariants] as const;

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "Layout";
export const route = "layouts";
export const populate = modelPopulate;
