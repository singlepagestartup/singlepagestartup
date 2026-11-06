import type { IModel } from "./index";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IProfilePresentation } from "@sps/social/models/profile/sdk/model";

/** Related records returned only after the caller's Chat access is checked. */
export interface IChatMessage extends IModel {
  authorProfileIds?: string[];
  authorProfiles?: IProfilePresentation[];
  attachments?: IFile[];
}
