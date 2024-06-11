import type { IRelation as IParentRelation } from "@sps/sps-website-builder-relations-slides-to-buttons-arrays-contracts";
import { IModel as ISlide } from "@sps/sps-website-builder-models-slide-contracts";

import { IModel as IButtonsArray } from "@sps/sps-website-builder-models-buttons-array-contracts";

export interface IRelation extends IParentRelation {
  slide: ISlide;

  buttonsArray: IButtonsArray;
}
