import { memo } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getLocalizedText } from "../title";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const ru = props.language === "ru";
  const createdAt = new Date(props.socialModuleChat.createdAt);
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
    .filter((name) => name && !/^subject-[0-9a-f-]{36}$/i.test(name));
  return (
    <Link
      href={`/${props.language}/social/chats/${props.socialModuleChat.id}`}
      prefetch={false}
      aria-current={isActive ? "page" : undefined}
      onNavigate={
        props.onSelectChat
          ? (event) => {
              if (isActive) event.preventDefault();
              props.onSelectChat?.();
            }
          : undefined
      }
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "flex min-h-14 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2",
        isActive ? "bg-muted text-foreground" : "hover:bg-muted/70",
        props.className,
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
        <MessageCircle className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <span className="line-clamp-2 min-w-0 break-words text-sm font-medium">
            {chatTitle}
          </span>
          <time
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
            dateTime={createdAt.toISOString()}
          >
            {createdAt.toLocaleDateString(props.language)}
          </time>
        </div>
        {participantNames.length > 0 && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {participantNames.slice(0, 3).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
});
