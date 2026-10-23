import { IComponentPropsExtended } from "./interface";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-relation="categories-to-articles"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Article
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.articleId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <Article
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                dataSource="props"
                data={entity}
                language={props.language}
                author={props.renderAuthor?.({ data: entity, size: "xs" })}
              />
            );
          });
        }}
      </Article>
    </div>
  );
}
