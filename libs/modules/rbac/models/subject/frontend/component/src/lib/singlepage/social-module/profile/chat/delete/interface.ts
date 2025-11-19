export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "social-module-profile-chat-delete" as const;

export interface IComponentProps extends ISpsComponentBase {
  language: string;
  data: IModel;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChatId: string;
  variant: typeof variant;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
