import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatMessageListDefault } from "../message/list/default";
import { Component as SocialModuleProfileChatDelete } from "../delete";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex w-full flex-col gap-6 border border-gray-200 rounded-md p-4",
        props.className,
      )}
    >
      <div className="flex items-center justify-between">
        <p>Variant: {props.socialModuleChat.variant}</p>
        <p>{props.socialModuleChat.description}</p>
        <SocialModuleProfileChatDelete
          isServer={props.isServer}
          variant="social-module-profile-chat-delete"
          data={props.data}
          language={props.language}
          socialModuleProfile={props.socialModuleProfile}
          socialModuleChatId={props.socialModuleChat.id}
        />
      </div>
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
