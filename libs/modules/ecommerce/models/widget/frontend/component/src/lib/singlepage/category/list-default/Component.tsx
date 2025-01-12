import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className || "")}
    >
      <div className="w-full max-w-7xl grid grid-cols-2 gap-12 mx-auto">
        <Category
          hostUrl={props.hostUrl}
          isServer={props.isServer}
          variant="find"
        >
          {({ data }) => {
            return data?.map((category, index) => {
              return (
                <Category
                  key={index}
                  isServer={props.isServer}
                  hostUrl={props.hostUrl}
                  variant={category.variant as any}
                  data={category}
                />
              );
            });
          }}
        </Category>
      </div>
    </div>
  );
}
