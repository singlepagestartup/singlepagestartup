import {
  IModel as IParentModel,
  variants as parentVariants,
} from "@sps/sps-website-builder-slider-contracts";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-website-builder-slider-contracts-extended";

export const variants = [...parentVariants] as const;

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "Slider";
export const route = "sliders";
export const populate = modelPopulate;
