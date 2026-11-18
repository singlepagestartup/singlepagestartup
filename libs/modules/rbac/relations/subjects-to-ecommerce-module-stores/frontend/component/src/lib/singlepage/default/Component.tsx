import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-ecommerce-module-stores"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <EcommerceModuleStore
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.ecommerceModuleStoreId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <EcommerceModuleStore
                key={entity.id}
                isServer={props.isServer}
                variant={entity.variant as any}
                dataSource="props"
                data={entity}
                language={props.language}
              >
                {props.children}
              </EcommerceModuleStore>
            );
          });
        }}
      </EcommerceModuleStore>
    </div>
  );
}
