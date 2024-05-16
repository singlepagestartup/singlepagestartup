import type { IRelation as IParentRelation } from "@sps/sps-website-builder-relations-hero-section-blocks-to-files-contracts";
import { IModel as IHeroSectionBlock } from "@sps/sps-website-builder-models-hero-section-block-contracts";

export interface IRelation extends IParentRelation {
  heroSectionBlock: IHeroSectionBlock;
}
