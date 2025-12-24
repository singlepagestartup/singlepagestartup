import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  variant: "me-social-module-profile-chat-overview-default";
  socialModuleChatId: ISocialModuleChat["id"];
};
