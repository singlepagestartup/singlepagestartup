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
  "me-social-module-profile-id-navigation-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  project: IAIChatProject;
  language?: string;
  threadId?: string;
  selected?: "settings" | "create";
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  /** Loaded by the specialized socialModuleChatFindByIdThreadFind reader; retry is client-only. */
  threadsRead: {
    data?: IResult["ISocialModuleChatFindByIdThreadFindResult"];
    isPending?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    error?: { message: string };
    refetch?: () => void;
  };
}
