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
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <div className="w-full max-w-7xl mx-auto">
        {props.children ?? (
          <Content
            isServer={props.isServer}
            language={props.language}
            renderAuthor={props.renderAuthor}
            articleSlug={props.articleSlug}
            renderContent={props.renderContent}
          />
        )}
      </div>
    </div>
  );
}
