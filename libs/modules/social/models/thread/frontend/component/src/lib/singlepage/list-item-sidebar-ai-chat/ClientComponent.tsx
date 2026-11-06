"use client";
import { internationalization } from "@sps/shared-configuration";
import Link from "next/link";

import { memo } from "react";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const localeBase = `/${props.language || internationalization.defaultLanguage.code}`;
  return (
    <Link
      prefetch={false}
      href={getLocalizedHref(localeBase, props.href)}
      aria-current={props.selected ? "page" : undefined}
      data-module="social"
      data-model="thread"
      data-variant={props.variant}
      data-id={props.data.id}
      className={`flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${props.topic ? "font-medium" : "font-normal"} ${props.selected ? "bg-card/10 text-default-foreground" : "text-default-foreground/70 hover:bg-card/10 hover:text-default-foreground"}`}
    >
      <Icon
        name={props.topic ? "chat-circle" : "file-text"}
        className="size-4 shrink-0 text-default-foreground/50"
      />
      <span className="min-w-0 flex-1 break-words">
        {props.data.title || props.data.adminTitle}
      </span>
    </Link>
  );
});
