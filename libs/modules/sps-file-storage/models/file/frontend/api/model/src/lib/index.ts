import type { IModel as IParentModel } from "@sps/sps-file-storage/models/file/contracts/root";
import {
  IModel as IParentModelExtended,
  populate as modelPopulate,
} from "@sps/sps-file-storage/models/file/contracts/extended";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export interface IModel extends IParentModel {}
export interface IModelExtended extends IParentModelExtended {}

export const tag = "file";
export const route = "/api/sps-file-storage/files";
export const populate = modelPopulate;
export const host = BACKEND_URL;
export const query = {
  populate,
};
export const options = {
  next: {
    tag,
    revalidate: REVALIDATE,
  },
};
