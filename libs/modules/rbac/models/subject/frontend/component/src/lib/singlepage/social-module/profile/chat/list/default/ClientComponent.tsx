"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";
import { ChatWorkspace, ChatWorkspaceNavigation } from "@sps/ui-adapter";
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
  const chatsLabel = ru ? "Чаты" : "Chats";
  const newChat = ru ? "Новый чат" : "New chat";
  const searchLabel = ru ? "Поиск чатов" : "Search chats";
  const createPermission = {
    permission: {
      method: "POST",
      route: `${route}/${props.data.id}/social-module/chats`,
    },
  };
  const [createOpen, setCreateOpen] = useState(false);
  const { search, onSearch, socialModuleChats: chats } = props;
  const handleChatCreated = useCallback(() => {
    setCreateOpen(false);
    onSearch("");
  }, [onSearch]);

  const navigation = (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col",
        props.compact && props.className,
      )}
    >
      <ChatWorkspaceNavigation
        label={chatsLabel}
        title={chatsLabel}
        heading={props.compact ? "h2" : "h1"}
        search={{ label: searchLabel, value: search, onChange: onSearch }}
        actions={
          <>
            {props.currentChatActions}
            <Subject
              isServer={false}
              variant="authentication-is-authorized-wrapper-default"
              skeleton={false}
              apiProps={{
                params: createPermission,
                reactQueryOptions: {
                  queryKey: consistencyQueryKey(
                    `${route}/authentication/is-authorized`,
                    createPermission,
                    clientHost,
                  ),
                  retry: false,
                },
              }}
            >
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
            </Subject>
          </>
        }
      >
        {chats.length ? (
          <ul className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1">
            {chats.map((socialModuleChat) => {
              const isCurrent =
                socialModuleChat.id === props.currentSocialModuleChatId;
              return (
                <li key={socialModuleChat.id} className="min-w-0">
                  <Subject
                    isServer={false}
                    variant="social-module-profile-chat-default"
                    data={props.data}
                    socialModuleProfile={props.socialModuleProfile}
                    socialModuleChatId={socialModuleChat.id}
                    currentSocialModuleChatId={props.currentSocialModuleChatId}
                    dataSource="props"
                    socialModuleChat={socialModuleChat}
                    lastMessageAt={socialModuleChat.lastMessageAt}
                    unreadCount={socialModuleChat.unreadCount}
                    language={props.language}
                    onSelectCurrentChat={
                      isCurrent ? props.onSelectCurrentChat : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status" className="px-3 py-4 text-sm text-muted-foreground">
            {search.trim()
              ? ru
                ? "Чаты не найдены"
                : "No matching chats"
              : ru
                ? "Чатов пока нет"
                : "No chats yet"}
          </p>
        )}
        {props.pagination}
      </ChatWorkspaceNavigation>
    </div>
  );

  if (props.compact) return navigation;

  return (
    <div className={cn("w-full min-w-0", props.className)}>
      <ChatWorkspace
        siteLayout
        navigation={navigation}
        navigationClassName="flex w-full flex-col overflow-hidden bg-card p-0 text-card-foreground lg:flex lg:w-80 lg:border-r lg:border-border"
      >
        <div className="hidden flex-1 place-items-center p-6 lg:grid">
          <p className="text-sm text-muted-foreground">
            {ru ? "Выберите чат" : "Choose a chat"}
          </p>
        </div>
      </ChatWorkspace>
    </div>
  );
}
