import type { IModel as IParentModel } from "@sps/sps-website-builder-cta-section-block-contracts";
import type { IModel as IButton } from "@sps/sps-website-builder-button-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-contracts/lib/models/file/interfaces";

export interface IModel extends IParentModel {
  media?: IFile[] | null;
  additionalMedia?: IFile[] | null;
  buttons?: IButton[];
}