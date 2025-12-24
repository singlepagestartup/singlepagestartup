export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IResult } from "@sps/rbac/models/subject/sdk/server";

export const variant = "social-module-profile-chat-overview-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  language: string;
  data: IModel;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChatId: ISocialModuleChat["id"];
  variant: typeof variant;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {
  socialModuleChat: IResult["ISocialModuleProfileFindByIdChatFindByIdResult"];
}
