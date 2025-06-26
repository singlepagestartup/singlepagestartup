"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatDefault } from "../../default";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      {props.socialModuleChats.map((socialModuleChat, index) => {
        return (
          <SocialModuleProfileChatDefault
            key={index}
            isServer={false}
            variant="social-module-profile-chat-default"
            data={props.data}
            socialModuleProfile={props.socialModuleProfile}
            socialModuleChatId={socialModuleChat.id}
            language={props.language}
          />
        );
      })}
    </div>
  );
}
