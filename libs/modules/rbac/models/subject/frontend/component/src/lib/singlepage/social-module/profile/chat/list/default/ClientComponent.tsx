"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { ChatWorkspace } from "@sps/ui-adapter";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@sps/shared-ui-shadcn";
import { Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getLocalizedText } from "../../title";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const Heading = props.compact ? "h2" : "h1";
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
    <nav
      aria-label={chatsLabel}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col",
        props.compact && props.className,
      )}
    >
      <header className="shrink-0 space-y-3 border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <Heading className="text-base font-semibold">{chatsLabel}</Heading>
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
        <label className="relative block">
          <span className="sr-only">{searchLabel}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchLabel}
            className="h-9 w-full rounded-lg border border-border bg-muted/60 pl-9 pr-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {chats.length ? (
          <ul className="grid gap-1">
            {chats.map((socialModuleChat) => {
              const isCurrent =
                socialModuleChat.id === props.currentSocialModuleChatId;
              return (
                <li
                  key={socialModuleChat.id}
                  className={cn(
                    "flex items-center gap-1",
                    isCurrent &&
                      props.currentChatActions &&
                      "rounded-lg bg-muted pr-1",
                  )}
                >
                  <Subject
                    isServer={false}
                    variant="social-module-profile-chat-default"
                    data={props.data}
                    socialModuleProfile={props.socialModuleProfile}
                    socialModuleChatId={socialModuleChat.id}
                    currentSocialModuleChatId={props.currentSocialModuleChatId}
                    dataSource="props"
                    socialModuleChat={socialModuleChat}
                    language={props.language}
                    onSelectCurrentChat={
                      isCurrent ? props.onSelectCurrentChat : undefined
                    }
                  />
                  {isCurrent && props.currentChatActions}
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
      </div>
    </nav>
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
        className="min-h-0 lg:min-h-[560px]"
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
