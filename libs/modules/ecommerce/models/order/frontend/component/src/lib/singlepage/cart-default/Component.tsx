import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@sps/shared-ui-shadcn";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";

import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import type {
  IModel as ILine,
  IOrderLineTotal,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";

function Line({
  props,
  line,
  totals,
}: {
  props: IComponentPropsExtended;
  line: ILine;
  totals: IOrderLineTotal[];
}) {
  const visibleTotals = totals.filter(
    (price) =>
      !props.billingModuleCurrencyId ||
      price.billingModuleCurrency.id === props.billingModuleCurrencyId,
  );
  return (
    <Card
      data-module="ecommerce"
      data-model="order"
      data-id={props.data.id}
      data-variant={props.variant}
      data-available={totals.some(
        (price) =>
          price.billingModuleCurrency.id === props.billingModuleCurrencyId,
      )}
      className={cn(
        "w-full flex flex-col data-[available=false]:opacity-70",
        props.className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-xs">Order #{props.data.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Quantity: {line.quantity}
        </p>
        <Product
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [{ column: "id", method: "eq", value: line.productId }],
              },
            },
          }}
        >
          {({ data: products }) =>
            products?.map((product) => (
              <Product
                key={product.id}
                isServer={props.isServer}
                dataSource="props"
                variant="cart-default"
                data={product}
                language={props.language}
              />
            ))
          }
        </Product>
        {visibleTotals.map((price) => (
          <p key={price.billingModuleCurrency.id}>
            {price.total} {price.billingModuleCurrency.symbol}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

export function Component(props: IComponentPropsExtended) {
  let lines;
  if (props.ordersToProducts) {
    lines = props.ordersToProducts.map((line) => (
      <Line key={line.id} props={props} line={line} totals={line.total} />
    ));
  } else {
    lines = (
      <OrdersToProducts
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.map((line) => (
            <OrdersToProducts
              key={line.id}
              isServer={props.isServer}
              variant="id-total-default"
              data={line}
              language={props.language}
            >
              {({ data: totals }) => (
                <Line props={props} line={line} totals={totals} />
              )}
            </OrdersToProducts>
          ))
        }
      </OrdersToProducts>
    );
  }
  return (
    <div className={cn("flex flex-col gap-1", props.className)}>
      {lines}
      {props.children}
    </div>
  );
}
