import type { IModel as IParentModel } from "@sps/sps-third-parties-models-widget-contracts";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-third-parties-models-widget-contracts-extended";

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "widget";
export const route = "widgets";
export const populate = modelPopulate;
