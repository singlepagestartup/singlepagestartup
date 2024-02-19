import type { IModel as IParentModel } from "@sps/sps-website-builder-logotype-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-file-contracts";

export interface IModel extends IParentModel {
  media?: IFile[] | null;
  additionalMedia?: IFile[] | null;
}
