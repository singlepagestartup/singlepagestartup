import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Article } from "@sps/blog/models/article/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-relation="profiles-to-blog-module-articles"
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
                  value: props.data.blogModuleArticleId,
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
                variant="default"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Article>
    </div>
  );
}
