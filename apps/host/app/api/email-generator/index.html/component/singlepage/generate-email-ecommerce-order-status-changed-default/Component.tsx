import React from "react";
import { IComponentPropsExtended } from "./interface";
import {
  Body,
  CodeBlock,
  Container,
  Head,
  Preview,
  Text,
} from "@react-email/components";
import { internationalization } from "@sps/shared-configuration";

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
          {props.data.ecommerce.order.ordersToProducts.map(
            (orderToProduct, index) => {
              return (
                <Text key={index}>
                  {
                    orderToProduct.product.title?.[
                      internationalization.defaultLanguage.code
                    ]
                  }{" "}
                  Quantity: {orderToProduct.quantity}
                </Text>
              );
            },
          )}
          <CodeBlock
            fontFamily="'CommitMono', monospace"
            language="json"
            theme={{}}
            code={JSON.stringify(props.data, null, 2)}
          />
        </Container>
      </Body>
    </>
  );
}
