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
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      {props.children ?? (
        <Content
          isServer={props.isServer}
          language={props.language}
          articleSlug={props.articleSlug}
          renderContent={props.renderContent}
          renderPrivateContent={props.renderPrivateContent}
        />
      )}
    </div>
  );
}
