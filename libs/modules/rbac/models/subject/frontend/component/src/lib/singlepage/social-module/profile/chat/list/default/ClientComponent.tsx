"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { ChatWorkspace, ChatWorkspaceNavigation } from "@sps/ui-adapter";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getLocalizedText } from "../../title";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const chatsLabel = ru ? "Чаты" : "Chats";
  const newChat = ru ? "Новый чат" : "New chat";
  const searchLabel = ru ? "Поиск чатов" : "Search chats";
  const untitled = ru ? "Чат без названия" : "Untitled chat";
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const handleChatCreated = useCallback(() => {
    setCreateOpen(false);
    setSearch("");
  }, []);
  const normalizedSearch = search.trim().toLocaleLowerCase(props.language);
  const chats = useMemo(() => {
    if (!normalizedSearch) return props.socialModuleChats;
    return props.socialModuleChats.filter((chat) =>
      getLocalizedText(chat.title, props.language, untitled)
        .toLocaleLowerCase(props.language)
        .includes(normalizedSearch),
    );
  }, [normalizedSearch, props.language, props.socialModuleChats, untitled]);

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
        search={{ label: searchLabel, value: search, onChange: setSearch }}
        actions={
          <>
            {props.currentChatActions}
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
            {normalizedSearch
              ? ru
                ? "Чаты не найдены"
                : "No matching chats"
              : ru
                ? "Чатов пока нет"
                : "No chats yet"}
          </p>
        )}
      </ChatWorkspaceNavigation>
    </div>
  );

  if (props.compact) return navigation;

  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6",
        props.className,
      )}
    >
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
