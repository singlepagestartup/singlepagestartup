import type { IModel as IParentModel } from "@sps/sps-website-builder-metatag-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-contracts/lib/models/file/interfaces";

export interface IModel extends IParentModel {
  favicon?: IFile | null;
}