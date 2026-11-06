import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";

import type { ReactNode } from "react";
import type {
  IModel,
  IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  project: IAIChatProject;
  source: import("@sps/knowledge/models/source/sdk/model").IModel;
  onDiscuss: (id: string) => void;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  /** Loaded by the specialized socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind reader; retry is client-only. */
  attachmentsRead: {
    data?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFindResult"];
    isPending?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    error?: { message: string };
    refetch?: () => void;
  };
}

export interface ISourceFileProps {
  language: string;
  file: IFile;
  removing: boolean;
  onRemove: (id: string) => void;
}
