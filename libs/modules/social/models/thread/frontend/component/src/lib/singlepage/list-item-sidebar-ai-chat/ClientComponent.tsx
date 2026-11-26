"use client";
import { internationalization } from "@sps/shared-configuration";
import Link from "next/link";

import { memo } from "react";
import { cn, getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { ChatListActivity, Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const localeBase = `/${props.language || internationalization.defaultLanguage.code}`;
  const title = props.title || props.data.title || props.data.adminTitle;
  return (
    <Link
      prefetch={false}
      href={getLocalizedHref(localeBase, props.href)}
      onNavigate={props.onNavigate}
      aria-current={props.selected ? "page" : undefined}
      data-module="social"
      data-model="thread"
      data-variant={props.variant}
      data-id={props.data.id}
      className={cn(
        "flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        props.topic ? "font-medium" : "font-normal",
        props.activityAt && "items-start gap-2.5",
        props.selected
          ? "bg-card/10 text-default-foreground"
          : "text-default-foreground/70 hover:bg-card/10 hover:text-default-foreground",
        props.className,
      )}
    >
      {!props.topic && (
        <Icon
          name="file-text"
          className="size-4 shrink-0 text-default-foreground/50"
        />
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn("block truncate", props.topic && "font-bold")}
          title={title || undefined}
        >
          {title}
        </span>
        {props.preview && (
          <span className="mt-0.5 flex min-w-0 items-baseline gap-1 text-xs font-normal leading-5 text-muted-foreground">
            {props.previewAuthor && (
              <span className="max-w-[40%] shrink-0 truncate font-medium text-foreground">
                {props.previewAuthor}:{" "}
              </span>
            )}
            <span className="min-w-0 truncate">{props.preview}</span>
          </span>
        )}
      </span>
      {props.activityAt && (
        <ChatListActivity
          language={props.language || internationalization.defaultLanguage.code}
          timestamp={props.activityAt}
          unreadCount={props.unreadCount}
        />
      )}
      {props.children}
    </Link>
  );
});
