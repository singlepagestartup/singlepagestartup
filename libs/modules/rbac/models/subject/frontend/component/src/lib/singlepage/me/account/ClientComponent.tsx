"use client";
import Link from "next/link";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Icon } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  if (!props.authenticated || !props.data)
    return (
      <Link
        href={`/${language}/ai-chat/sign-in`}
        className={cn(
          "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2",
          props.className,
        )}
      >
        <Icon name="user-circle" className="size-6" />
        {language === "ru" ? "Войти" : "Sign in"}
      </Link>
    );
  return (
    <Subject
      isServer={false}
      variant="me-account-ai-chat"
      data={props.data}
      language={language}
      className={props.className}
    />
  );
}
