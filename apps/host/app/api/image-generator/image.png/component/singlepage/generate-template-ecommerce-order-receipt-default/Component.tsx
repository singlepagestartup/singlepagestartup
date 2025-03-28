import React from "react";
import { IComponentPropsExtended } from "./interface";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      style={{
        display: "flex",
        padding: "1rem",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "Primary",
            fontSize: "1.5rem",
            fontWeight: "bold",
          }}
        >
          Order Receipt
        </p>
        <p
          style={{
            fontFamily: "Default",
            fontSize: "1rem",
          }}
        >
          {props.data.ecommerce.order.id}
        </p>
        {props.data.ecommerce.order.ordersToProducts.map(
          (orderToProduct, index) => {
            return (
              <p
                key={index}
                style={{
                  fontFamily: "Default",
                  fontSize: "1rem",
                }}
              >
                {
                  orderToProduct.product.title?.[
                    internationalization.defaultLanguage.code
                  ]
                }{" "}
                Quantity: {orderToProduct.quantity}
              </p>
            );
          },
        )}
        <p
          style={{
            fontFamily: "Default",
            fontSize: "1rem",
          }}
        >
          Amount: {props.data.ecommerce.order.checkoutAttributes.amount}
        </p>
        <p
          style={{
            fontFamily: "Default",
            fontSize: "1rem",
          }}
        >
          Currency:{" "}
          {
            props.data.ecommerce.order.ordersToBillingModuleCurrencies[0]
              .billingModuleCurrency.symbol
          }
        </p>
        <p
          style={{
            fontFamily: "Default",
            fontSize: "1rem",
          }}
        >
          props.data: {JSON.stringify(props.data)}
        </p>
      </div>
    </div>
  );
}
