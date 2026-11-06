"use client";
import type { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Subject
        isServer={false}
        variant="ecommerce-module-order-list-default"
        data={props.data}
        language={props.language}
        apiProps={{ params: { includeCartDetails: true } }}
      >
        {({ data }) => {
          const orders = data.filter(
            (order) =>
              (!props.ecommerceModuleStore ||
                order.cartDetails?.storeIds.includes(
                  props.ecommerceModuleStore.id,
                )) &&
              order.cartDetails?.lines.some(
                (line) => line.productId === props.ecommerceModuleProduct.id,
              ),
          );
          return orders.length ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="grid gap-3 rounded-xl border border-border bg-muted/40 p-3"
              >
                <Subject
                  isServer={false}
                  variant="ecommerce-module-order-update-default"
                  dataSource="props"
                  data={props.data}
                  ecommerceModuleOrder={order}
                  language={props.language}
                />
                <Subject
                  isServer={false}
                  variant="ecommerce-module-order-delete-default"
                  dataSource="props"
                  data={props.data}
                  ecommerceModuleOrder={order}
                  language={props.language}
                />
                <Subject
                  isServer={false}
                  variant="ecommerce-module-order-checkout-default"
                  dataSource="props"
                  ecommerceModuleProduct={props.ecommerceModuleProduct}
                  data={props.data}
                  ecommerceModuleOrder={order}
                  language={props.language}
                />
              </div>
            ))
          ) : (
            <Subject
              isServer={false}
              variant="ecommerce-module-order-create-default"
              dataSource="props"
              data={props.data}
              ecommerceModuleProduct={props.ecommerceModuleProduct}
              ecommerceModuleStore={props.ecommerceModuleStore}
              language={props.language}
            />
          );
        }}
      </Subject>
    </div>
  );
}
