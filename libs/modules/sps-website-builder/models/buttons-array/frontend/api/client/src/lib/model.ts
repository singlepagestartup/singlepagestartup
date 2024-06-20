import {
  IModel as IParentModel,
  variants as parentVariants,
} from "@sps/sps-website-builder/models/buttons-array/contracts/root";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-website-builder/models/buttons-array/contracts/extended";

export const variants = [...parentVariants] as const;

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "buttons-array";
export const route = "buttons-arrays";
export const populate = modelPopulate;
