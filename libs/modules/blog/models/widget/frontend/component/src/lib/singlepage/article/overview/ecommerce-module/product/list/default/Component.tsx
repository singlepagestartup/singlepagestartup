import { Component as Content } from "./Content";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8",
        props.data.className,
        props.className,
      )}
    >
      {props.children ?? (
        <Content
          isServer={props.isServer}
          language={props.language}
          articleSlug={props.articleSlug}
          renderProduct={props.renderProduct}
        />
      )}
    </div>
  );
}
