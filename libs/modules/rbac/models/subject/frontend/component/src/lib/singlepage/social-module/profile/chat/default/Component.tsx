import { memo } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ChatListActivity } from "@sps/ui-adapter";
import { getLocalizedText } from "../title";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const ru = props.language === "ru";
  const isActive =
    props.currentSocialModuleChatId === props.socialModuleChat.id;
  const chatTitle = getLocalizedText(
    props.socialModuleChat.title,
    props.language,
    ru ? "Чат без названия" : "Untitled chat",
  );
  const participantNames = (props.socialModuleChat.participants || [])
    .filter((profile) => profile.id !== props.socialModuleProfile.id)
    .map((profile) => getLocalizedText(profile.title, props.language, ""))
    .filter((name) => name && !/^subject-[0-9a-f-]{36}$/i.test(name))
    .slice(0, 3)
    .join(", ");
  return (
    <Link
      href={`/${props.language}/social/chats/${props.socialModuleChat.id}`}
      prefetch={false}
      aria-current={isActive ? "page" : undefined}
      onNavigate={
        isActive && props.onSelectCurrentChat
          ? (event) => {
              event.preventDefault();
              props.onSelectCurrentChat?.();
            }
          : undefined
      }
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2",
        isActive ? "bg-muted text-foreground" : "hover:bg-muted/70",
        props.className,
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <MessageCircle className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" title={chatTitle}>
          {chatTitle}
        </span>
        {participantNames && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {participantNames}
          </p>
        )}
      </div>
      <ChatListActivity
        language={props.language}
        timestamp={props.lastMessageAt ?? props.socialModuleChat.createdAt}
        unreadCount={props.unreadCount}
      />
    </Link>
  );
});
