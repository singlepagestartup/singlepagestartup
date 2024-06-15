import type { IRelation as IParentRelation } from "@sps/sps-website-builder-relations-metadata-to-sps-file-storage-module-files-contracts";
import {
  IRelation as IParentRelationExtended,
  populate as relationPopulate,
} from "@sps/sps-website-builder-relations-metadata-to-sps-file-storage-module-files-contracts-extended";

export interface IRelation extends IParentRelation {}
export interface IRelationExtended extends IParentRelationExtended {}

export const tag = "metadata-to-sps-file-storage-module-files";
export const route = "metadata-to-sps-file-storage-module-files";
export const populate = relationPopulate;
