import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatMessageListDefault } from "../message/list/default";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      <p>{props.socialModuleChat.description}</p>
      <SocialModuleProfileChatMessageListDefault
        isServer={props.isServer}
        variant="social-module-profile-chat-message-list-default"
        data={props.data}
        language={props.language}
        socialModuleProfile={props.socialModuleProfile}
        socialModuleChat={props.socialModuleChat}
      />
    </div>
  );
}
