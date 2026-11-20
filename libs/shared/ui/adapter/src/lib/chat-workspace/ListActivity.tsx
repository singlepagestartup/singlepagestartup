import type { IChatListActivityProps } from "./interface";

export function ChatListActivity({
  language,
  timestamp,
  unreadCount,
}: IChatListActivityProps) {
  const time = timestamp ? new Date(timestamp) : undefined;
  const dateTime = time && Number.isFinite(time.getTime()) ? time : undefined;
  return (
    <span className="flex shrink-0 flex-col items-end gap-1 text-xs tabular-nums text-muted-foreground">
      {dateTime && (
        <time
          dateTime={dateTime.toISOString()}
          title={dateTime.toLocaleString(language)}
          className="whitespace-nowrap"
        >
          {dateTime.toLocaleTimeString(language, {
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          })}
        </time>
      )}
      {typeof unreadCount === "number" && unreadCount > 0 && (
        <span className="relative inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-semibold text-primary-foreground">
          <span className="sr-only">
            {language === "ru" ? "Непрочитано: " : "Unread: "}
          </span>
          {unreadCount}
        </span>
      )}
    </span>
  );
}
