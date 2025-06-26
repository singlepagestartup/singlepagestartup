export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IResult } from "@sps/rbac/models/subject/sdk/server";

export const variant = "social-module-profile-chat-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  language: string;
  data: IModel;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChatId: string;
  variant: typeof variant;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {
  socialModuleChat: IResult["ISocialModuleProfileFindByIdChatFindByIdResult"];
}
