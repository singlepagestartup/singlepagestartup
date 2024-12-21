import React from "react";
import { IComponentPropsExtended } from "./interface";
import { Body, Container, Head, Preview, Text } from "@react-email/components";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      <Head />
      <Preview>
        Order Status Is Changed To {props.data.ecommerce.order.status}
      </Preview>

      <Body>
        <Container>
          <Text>Order Id: {props.data.ecommerce.order.id}</Text>
          <Text>Status: {props.data.ecommerce.order.status}</Text>
          <Text>
            Amount: {props.data.ecommerce.order.checkoutAttributes.amount}
          </Text>
          <Text>
            Currency:{" "}
            {
              props.data.ecommerce.order.ordersToBillingModuleCurrencies[0]
                .billingModuleCurrency.symbol
            }
          </Text>
          <Text>Component payload: {JSON.stringify(props)}</Text>
          {props.data.ecommerce.order.ordersToProducts.map(
            (orderToProduct, index) => {
              return (
                <Text key={index}>
                  {orderToProduct.product.title} Quantity:{" "}
                  {orderToProduct.quantity}
                </Text>
              );
            },
          )}
        </Container>
      </Body>
    </>
  );
}
