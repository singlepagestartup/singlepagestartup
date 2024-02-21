import type { IModel as IParentModel } from "@sps/sps-website-builder-contact-section-block-contracts";
import type { IModel as IForm } from "@sps/sps-crm-form-contracts";
import type { IModel as IFile } from "@sps/sps-file-storage-file-contracts";
import type { IModel as IButtonsArray } from "@sps/sps-website-builder-buttons-array-contracts";

export interface IModel extends IParentModel {
  media?: IFile | null;
  additionalMedia?: IFile[] | null;
  form?: IForm | null;
  buttonsArrays?: IButtonsArray[] | null;
}