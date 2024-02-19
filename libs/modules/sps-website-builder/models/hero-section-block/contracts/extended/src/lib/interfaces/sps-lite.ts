import type { IModel as IParentModel } from "@sps/sps-website-builder-hero-section-block-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-file-contracts";
import type { IModel as IButton } from "@sps/sps-website-builder-button-contracts";

export interface IModel extends IParentModel {
  buttons?: IButton[] | null;
  media?: IFile[] | null;
  additionalMedia?: IFile[] | null;
}
