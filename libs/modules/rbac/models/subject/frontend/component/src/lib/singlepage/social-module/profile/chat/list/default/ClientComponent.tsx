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
import { useEffect } from "react";

let render = 0;

export function Component(props: IComponentPropsExtended) {
  useEffect(() => {
    render++;
  }, []);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col", props.className)}
    >
      {render}
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
      {props.socialModuleChats.map((socialModuleChat) => {
        return (
          <SocialModuleProfileChatDefault
            key={socialModuleChat.id}
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
