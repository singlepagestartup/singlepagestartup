import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Article } from "@sps/blog/models/article/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-relation="widgets-to-articles"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full py-10 text-center flex flex-col gap-1")}
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
          return data?.map((entity, index) => {
            return (
              <Article
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
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
