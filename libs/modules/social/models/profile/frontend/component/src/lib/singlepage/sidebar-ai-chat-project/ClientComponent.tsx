"use client";
import { internationalization } from "@sps/shared-configuration";
import Link from "next/link";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  const localeBase = `/${language}`;
  return (
    <div
      data-module="social"
      data-model="profile"
      data-variant={props.variant}
      data-id={props.data.id}
    >
      <h2 className="mb-3 break-words text-lg font-semibold">
        {props.data.title?.[language] ||
          props.data.title?.en ||
          props.data.adminTitle}
      </h2>
      <nav
        aria-label={ru ? "Навигация по проекту" : "Project navigation"}
        className="space-y-1"
      >
        <Link
          prefetch={false}
          href={getLocalizedHref(localeBase, props.settingsHref)}
          aria-label={ru ? "Настройки проекта" : "Project settings"}
          aria-current={props.settingsSelected ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-card/10 ${focus} ${props.settingsSelected ? "bg-card/15" : "text-default-foreground/80"}`}
        >
          <Icon name="gear-six" className="size-4" />

          {ru ? "Настройки" : "Settings"}
        </Link>
        {props.children}
      </nav>
      <section
        aria-label={ru ? "Обсуждения проекта" : "Project threads"}
        className="mt-5 border-t border-default-foreground/10 pt-4"
      >
        <h3 className="mb-3 text-xs font-semibold text-default-foreground/60">
          {ru ? "Обсуждения" : "Threads"}
        </h3>
        {props.threads}
        <Link
          prefetch={false}
          href={getLocalizedHref(localeBase, props.newThreadHref)}
          aria-current={props.creatingThread ? "page" : undefined}
          className={`flex min-h-11 w-full items-center gap-2 rounded-xl border border-default-foreground/15 px-3 py-2 text-left text-sm text-default-foreground/80 hover:bg-card/10 ${props.creatingThread ? "bg-card/15" : ""} ${focus}`}
        >
          <Icon name="plus" className="size-4" />

          {ru ? "Новое обсуждение" : "New thread"}
        </Link>
      </section>
    </div>
  );
}
