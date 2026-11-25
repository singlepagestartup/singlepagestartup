import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { cn } from "@sps/shared-frontend-client-utils/cn";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  if (!props.storeId) return null;

  function render(store: IStore) {
    return (
      <Store
        isServer={props.isServer}
        variant="header-default"
        dataSource="props"
        data={store}
        language={props.language}
      >
        {props.children}
      </Store>
    );
  }

  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("min-w-0", props.data.className, props.className)}
    >
      {props.store?.id === props.storeId ? (
        render(props.store)
      ) : (
        <Store
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              limit: 1,
              filters: {
                and: [{ column: "id", method: "eq", value: props.storeId }],
              },
            },
          }}
        >
          {({ data }) => data?.[0] && render(data[0])}
        </Store>
      )}
    </div>
  );
}
