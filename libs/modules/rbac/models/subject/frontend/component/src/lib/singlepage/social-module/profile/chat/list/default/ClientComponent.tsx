"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SocialModuleProfileChatDefault } from "../../default";
import { Component as SocialModuleProfileChatCreate } from "../../create";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col", props.className)}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            + New chat
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>New Chat</DialogTitle>
          <SocialModuleProfileChatCreate
            isServer={false}
            variant="social-module-profile-chat-create"
            data={props.data}
            socialModuleProfile={props.socialModuleProfile}
            language={props.language}
          />
        </DialogContent>
      </Dialog>
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
