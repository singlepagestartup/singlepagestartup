import type { IModel } from "./index";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IProfilePresentation } from "@sps/social/models/profile/sdk/model";

export interface IPrivateChatAttachment {
  id: string;
  name: string;
  mimeType?: string;
}

/** Related records returned only after the caller's Chat access is checked. */
export interface IChatMessage extends IModel {
  authorProfileIds?: string[];
  authorProfiles?: IProfilePresentation[];
  attachments?: IFile[];
  privateAttachments?: IPrivateChatAttachment[];
}

/** Membership in a single thread, without message contents or storage locations. */
export interface IChatAttachmentIndexEntry {
  id: string;
  variant: IModel["variant"];
  publicAttachmentRefs: Pick<IPrivateChatAttachment, "id" | "name">[];
  privateAttachments: IPrivateChatAttachment[];
}

export type TChatThreadReadResult<IsIndex extends boolean> =
  IsIndex extends true ? IChatAttachmentIndexEntry[] : IChatMessage[];
