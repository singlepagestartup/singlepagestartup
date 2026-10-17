import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { ReactNode } from "react";
import type {
  IModel,
  IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  project: IAIChatProject;
  thread: IThread;
  target: string;
  onTargetChange: (id: string) => void;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  /** Loaded by the specialized socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind reader; retry is client-only. */
  sourcesRead: {
    data?: IResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindResult"];
    isPending?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    error?: { message: string };
    refetch?: () => void;
  };
}

export interface IAttachment {
  id: string;
  file: File;
}

export interface IAttachmentProps {
  attachment: IAttachment;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (id: string, targetId: string) => void;
}
