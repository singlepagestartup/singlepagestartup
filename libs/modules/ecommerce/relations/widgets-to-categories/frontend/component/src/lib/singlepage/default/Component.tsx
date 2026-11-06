import { IComponentPropsExtended } from "./interface";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-relation="widgets-to-categories"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
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
          return data?.map((entity) => {
            return (
              <Category
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                dataSource="props"
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
