import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Category } from "@sps/blog/models/category/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-relation="widgets-to-categories"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Category
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.categoryId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Category
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Category>
    </div>
  );
}
