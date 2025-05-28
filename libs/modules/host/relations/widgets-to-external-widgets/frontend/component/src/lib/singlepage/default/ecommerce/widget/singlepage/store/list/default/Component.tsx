import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as EcommerceModuleWidgetsToStores } from "@sps/ecommerce/relations/widgets-to-stores/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <EcommerceModuleWidgetsToStores
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "widgetId",
                method: "eq",
                value: props.data.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <EcommerceModuleStore
              isServer={props.isServer}
              key={index}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "id",
                        method: "eq",
                        value: entity.storeId,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: stores }) => {
                return stores?.map((store, index) => {
                  return (
                    <EcommerceModuleStore
                      key={index}
                      isServer={props.isServer}
                      variant={store.variant as any}
                      data={store}
                      language={props.language}
                    />
                  );
                });
              }}
            </EcommerceModuleStore>
          );
        });
      }}
    </EcommerceModuleWidgetsToStores>
  );
}
