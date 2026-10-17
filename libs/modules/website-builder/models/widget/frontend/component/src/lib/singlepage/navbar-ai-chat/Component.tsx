import Link from "next/link";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import { Component as WidgetLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const localeBase = `/${props.language || "en"}`;
  const helpSelected = props.helpSelected ?? false;
  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  return (
    <header
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant="navbar-ai-chat"
      className="border-b border-border bg-card font-default text-foreground"
    >
      <nav
        aria-label="AI Chat navigation"
        className="mx-auto flex min-h-18 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:min-h-24 md:py-5 sm:px-6"
      >
        <WidgetLogotypes
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  { column: "widgetId", method: "eq", value: props.data.id },
                ],
              },
            },
          }}
        >
          {({ data }) =>
            data?.map((link) => (
              <WidgetLogotypes
                key={link.id}
                isServer={props.isServer}
                variant="default"
                className="w-auto"
                data={link}
                language={props.language || "en"}
              />
            ))
          }
        </WidgetLogotypes>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            href={getLocalizedHref(localeBase, "/ai-chat/help")}
            aria-current={helpSelected ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${focus} ${helpSelected ? "bg-default font-semibold text-default-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon name="question" />
            Help
          </Link>
          {props.children}
          {!props.children && (
            <Link
              href={getLocalizedHref(localeBase, "/ai-chat/sign-in")}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-muted ${focus}`}
            >
              <Icon name="user-circle" />
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
