import {
  IModel as IParentModel,
  variants as parentVariants,
} from "@sps/sps-website-builder-features-section-block-contracts";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-website-builder-features-section-block-contracts-extended";

export const variants = [...parentVariants] as const;

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "FeaturesSectionBlock";
export const route = "components/page-blocks.features-section-block";
export const populate = modelPopulate;