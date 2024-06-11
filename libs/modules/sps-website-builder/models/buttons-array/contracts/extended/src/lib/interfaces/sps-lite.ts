import { IRelation as ISlidesToButtonsArrays } from "@sps/sps-website-builder-relations-slides-to-buttons-arrays-contracts";
import { IRelation as IFooterBlocksToButtonsArrays } from "@sps/sps-website-builder-relations-footer-blocks-to-buttons-arrays-contracts";
import { IRelation as IButtonsArraysToButtons } from "@sps/sps-website-builder-relations-buttons-arrays-to-buttons-contracts";
import { IRelation as IHeroSectionBlocksToButtonsArrays } from "@sps/sps-website-builder-relations-hero-section-blocks-to-buttons-arrays-contracts";
import { IRelation as INavbarBlocksToButtonsArrays } from "@sps/sps-website-builder-relations-navbar-blocks-to-buttons-arrays-contracts";
import type { IModel as IParentModel } from "@sps/sps-website-builder-models-buttons-array-contracts";
import type { IModel as IButton } from "@sps/sps-website-builder-models-button-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-models-file-contracts";

export interface IModel extends IParentModel {
  slidesToButtonsArrays: ISlidesToButtonsArrays[];
  footerBlocksToButtonsArrays: IFooterBlocksToButtonsArrays[];
  buttonsArraysToButtons: IButtonsArraysToButtons[];
  heroSectionBlocksToButtonsArrays: IHeroSectionBlocksToButtonsArrays[];
  navbarBlocksToButtonsArrays: INavbarBlocksToButtonsArrays[];
  buttons: IButton[];
  media?: IFile[] | null;
  additionalMedia?: IFile[] | null;
}
