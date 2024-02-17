import {
  IModel as IParentModel,
  variants as parentVariants,
} from "@sps/sps-website-builder-faq-block-contracts";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-website-builder-faq-block-contracts-extended";

export const variants = [...parentVariants] as const;

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "FaqsBlock";
export const route = "components/page-blocks.faqs-block";
export const populate = modelPopulate;
