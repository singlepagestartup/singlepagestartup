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
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export function Component(props: IComponentPropsExtended) {
  const pathname = usePathname();
  const currentSocialModuleChatId =
    pathname.match(/\/social\/chats\/([^/]+)/)?.[1] || "";

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-[calc(100vh-4rem)] min-h-0 w-full flex-col overflow-hidden bg-slate-50",
        props.className,
      )}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-r border-slate-200 bg-slate-50">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium text-slate-950">
              Chats
            </h1>
            <p className="truncate text-xs text-slate-500">
              {props.socialModuleChats.length
                ? `${props.socialModuleChats.length} active chat${
                    props.socialModuleChats.length === 1 ? "" : "s"
                  }`
                : "No chats yet"}
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="New chat"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New chat</span>
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
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {props.socialModuleChats.length ? (
            <div className="flex flex-col gap-1">
              {props.socialModuleChats.map((socialModuleChat) => {
                return (
                  <SocialModuleProfileChatDefault
                    key={socialModuleChat.id}
                    isServer={false}
                    variant="social-module-profile-chat-default"
                    data={props.data}
                    socialModuleProfile={props.socialModuleProfile}
                    socialModuleChatId={socialModuleChat.id}
                    currentSocialModuleChatId={currentSocialModuleChatId}
                    language={props.language}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
              <h2 className="text-sm font-medium text-slate-900">
                Start a chat
              </h2>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Create a chat to open a shared workspace with threads and
                messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
