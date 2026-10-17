import Link from "next/link";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Component as WidgetLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const pathname = `/${props.language || "en"}`;
  return (
    <footer
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant="footer-ai-chat"
      className="mx-auto mt-24 flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-border px-4 py-8 font-default text-sm text-muted-foreground sm:px-6"
    >
      <WidgetLogotypes
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
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
      <div className="flex flex-wrap gap-4">
        <Link href={getLocalizedHref(pathname, "/ai-chat/projects")}>
          Start with my files
        </Link>
        <Link href={getLocalizedHref(pathname, "/ai-chat/sign-in")}>
          Sign in
        </Link>
        <Link href={getLocalizedHref(pathname, "/framework")}>
          Code Framework
        </Link>
      </div>
    </footer>
  );
}
