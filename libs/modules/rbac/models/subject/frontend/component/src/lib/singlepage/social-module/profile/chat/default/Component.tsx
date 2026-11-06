import { memo } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { getLocalizedText } from "../title";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const createdAt = new Date(props.socialModuleChat.createdAt);
  const isActive =
    props.currentSocialModuleChatId === props.socialModuleChat.id;
  const chatTitle = getLocalizedText(
    props.socialModuleChat.title,
    props.language,
    "Untitled chat",
  );
  const participants = props.socialModuleChat.participants || [];
  return (
    <Link
      href={`/${props.language}/social/chats/${props.socialModuleChat.id}`}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
        props.className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition",
          isActive
            ? "bg-white/10 text-white"
            : "bg-slate-200/70 text-slate-600 group-hover:bg-slate-200",
        )}
      >
        {props.socialModuleChat.variant?.slice(0, 1).toUpperCase() || "C"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex w-full min-w-0 items-center justify-between gap-2">
          <h2
            className={cn(
              "min-w-0 flex-1 truncate text-sm font-medium",
              isActive ? "text-white" : "text-slate-900",
            )}
          >
            {chatTitle}
          </h2>
          <span
            className={cn(
              "shrink-0 text-[10px] tabular-nums",
              isActive ? "text-white/50" : "text-slate-400",
            )}
          >
            {createdAt.toLocaleDateString()}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-1.5">
          {participants.slice(0, 3).map((profile) => (
            <span
              key={profile.id}
              className={cn(
                "max-w-28 truncate rounded-full px-2 py-0.5 text-[11px]",
                isActive
                  ? "bg-white/10 text-white/70"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {profile.slug}
            </span>
          ))}
          {participants.length > 3 ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                isActive
                  ? "bg-white/10 text-white/60"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              +{participants.length - 3}
            </span>
          ) : null}
          {!participants.length ? (
            <span
              className={cn(
                "truncate text-xs",
                isActive ? "text-white/50" : "text-slate-400",
              )}
            >
              Participant details unavailable
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
});
