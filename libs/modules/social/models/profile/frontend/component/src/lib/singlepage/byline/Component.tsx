import type { IComponentPropsExtended } from "./interface";
import { Component as ProfileAvatar } from "../chat-profile-avatar";
import { cn } from "@sps/shared-frontend-client-utils";
import { getLocalizedPlainText } from "../plain-text";

export function Component(props: IComponentPropsExtended) {
  const name =
    props.data.title?.[props.language] ||
    props.data.title?.en ||
    props.data.slug;
  const small = props.size === "xs";
  const subtitle = getLocalizedPlainText(props.data.subtitle, props.language);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase(props.language);
  return (
    <div
      data-module="social"
      data-model="profile"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 items-center gap-2",
        props.data.className,
        props.className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground",
          small ? "size-6" : "size-11",
        )}
      >
        {initials}
        <ProfileAvatar
          isServer={props.isServer}
          variant="chat-profile-avatar"
          data={props.data}
          language={props.language}
          className="absolute inset-0 size-full"
          fallback={<></>}
        />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "break-words font-medium text-foreground",
            small ? "text-xs" : "text-sm",
            props.inverse && "text-default-foreground",
          )}
        >
          {name}
        </p>
        {!small && subtitle ? (
          <p
            className={cn(
              "text-xs leading-5 text-muted-foreground",
              props.inverse && "text-default-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
