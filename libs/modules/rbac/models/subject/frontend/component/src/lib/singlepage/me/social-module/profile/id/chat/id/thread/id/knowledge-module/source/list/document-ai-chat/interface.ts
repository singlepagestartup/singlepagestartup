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
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  project: IAIChatProject;
  thread: IThread;
  onDiscuss: (id: string) => void;
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

export interface IDraftSourceProps {
  id: string;
  hasSavedSources: boolean;
  title?: string;
  placeholder?: string;
  onSave: (
    id: string,
    value: { title: string; content: string },
    files: File[],
  ) => Promise<string>;
}

export interface IDevelopmentHandoffProps {
  fileName: string;
  revision: string;
  hasContent: boolean;
  hasPendingProposal: boolean;
  unavailable: boolean;
  frameworkHref: string;
}

export interface IDevelopmentCopyFeedback {
  state: "idle" | "pending" | "success" | "error";
  text: string;
}
