import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/rbac/models/widget/sdk/model";
export interface IComponentProps extends ISpsComponentBase {
  variant: "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
  data: IModel;
  language: string;
  url: string;
}
