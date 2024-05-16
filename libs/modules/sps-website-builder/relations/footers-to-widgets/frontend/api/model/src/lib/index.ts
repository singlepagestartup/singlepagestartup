import type { IRelation as IParentRelation } from "@sps/sps-website-builder-relations-footers-to-widgets-contracts";
import {
  IRelation as IParentRelationExtended,
  populate as relationPopulate,
} from "@sps/sps-website-builder-relations-footers-to-widgets-contracts-extended";

export interface IRelation extends IParentRelation {}
export interface IRelationExtended extends IParentRelationExtended {}

export const tag = "footers-to-widgets";
export const route = "footers-to-widgets";
export const populate = relationPopulate;