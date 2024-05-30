import type { IRelation as IParentRelation } from "@sps/sps-website-builder-relations-hero-section-blocks-to-sps-file-storage-widgets-contracts";
import {
  IRelation as IParentRelationExtended,
  populate as relationPopulate,
} from "@sps/sps-website-builder-relations-hero-section-blocks-to-sps-file-storage-widgets-contracts-extended";

export interface IRelation extends IParentRelation {}
export interface IRelationExtended extends IParentRelationExtended {}

export const tag = "hero-section-blocks-to-sps-file-storage-widgets";
export const route = "hero-section-blocks-to-sps-file-storage-widgets";
export const populate = relationPopulate;