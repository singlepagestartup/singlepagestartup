import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type {
  IModel,
  IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";

import type { IResult } from "@sps/rbac/models/subject/sdk/server";

export const variant =
  "me-social-module-profile-id-chat-id-thread-id-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  projects?: IAIChatProject[];
  project?: IAIChatProject;
  socialModuleThreadId?: string;
  navigation?: import("react").ReactNode;
  loading?: import("react").ReactNode;
  renderLoadError?: (props: {
    retry: () => void;
    unavailable: boolean;
  }) => import("react").ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  threads?: IResult["ISocialModuleChatFindByIdThreadFindResult"];
  threadsLoading: boolean;
  threadsError?: string;
  retryThreads?: () => void;
}

export interface IClientComponentProps extends IComponentPropsExtended {
  project: NonNullable<IComponentPropsExtended["project"]>;
}
