"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const Heading = props.compact ? "h2" : "h1";
  const newChat = ru ? "Новый чат" : "New chat";
  const [createOpen, setCreateOpen] = useState(false);
  const onSelectChat = props.onSelectChat;
  const handleChatCreated = useCallback(() => {
    setCreateOpen(false);
    onSelectChat?.();
  }, [onSelectChat]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex min-h-0 w-full flex-col overflow-hidden bg-card",
        props.compact
          ? "max-h-[80dvh]"
          : "mx-auto my-4 h-[calc(100dvh-5rem)] max-w-3xl rounded-2xl border border-border",
        props.className,
      )}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3",
            props.compact && "pr-12",
          )}
        >
          <Heading className="text-base font-semibold">
            {ru ? "Чаты" : "Chats"}
          </Heading>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                title={newChat}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">{newChat}</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              aria-describedby={undefined}
              closeLabel={ru ? "Закрыть форму" : "Close form"}
            >
              <DialogTitle>{newChat}</DialogTitle>
              <Subject
                isServer={false}
                variant="social-module-profile-chat-create"
                data={props.data}
                socialModuleProfile={props.socialModuleProfile}
                language={props.language}
                onCreate={handleChatCreated}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {props.socialModuleChats.length ? (
            <div className="flex flex-col gap-1">
              {props.socialModuleChats.map((socialModuleChat) => {
                return (
                  <Subject
                    key={socialModuleChat.id}
                    isServer={false}
                    variant="social-module-profile-chat-default"
                    data={props.data}
                    socialModuleProfile={props.socialModuleProfile}
                    socialModuleChatId={socialModuleChat.id}
                    currentSocialModuleChatId={props.currentSocialModuleChatId}
                    dataSource="props"
                    socialModuleChat={socialModuleChat}
                    language={props.language}
                    onSelectChat={props.onSelectChat}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-32 place-items-center px-4 text-center">
              <p className="text-sm text-muted-foreground">
                {ru ? "Чатов пока нет" : "No chats yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
