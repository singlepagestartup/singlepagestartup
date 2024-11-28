"use client";

import { IComponentPropsExtended } from "../interface";
import { api } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/client";
import { Component as EcommerceOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const createEntity = api.create();

  return (
    <EcommerceOrdersToProducts
      isServer={false}
      hostUrl={props.hostUrl}
      variant="create"
      product={props.product}
      successCallback={(data) => {
        createEntity.mutate({
          data: {
            subjectId: props.data.id,
            ecommerceModuleOrderId: data.orderId,
          },
        });
      }}
    />
  );
}
