import React from "react";
import { IComponentPropsExtended } from "./interface";
import { internationalization } from "@sps/shared-configuration";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <img
        src={
          NEXT_PUBLIC_API_SERVICE_URL +
          "/public" +
          props.data.fileStorage.file.file
        }
        style={{
          position: "absolute",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          padding: "6rem 0.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            fontFamily: "Primary",
            fontSize: "5rem",
            fontWeight: "bold",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          Order Receipt
        </p>
        <p
          style={{
            fontFamily: "Default",
            fontSize: "3rem",
            textAlign: "center",
            margin: "0 auto",
          }}
        >
          {props.data.ecommerce.order.id}
        </p>
        {props.data.ecommerce.order.ordersToProducts.map(
          (orderToProduct, index) => {
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid black",
                  padding: "1rem",
                  margin: "1rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "Primary",
                    fontSize: "2rem",
                  }}
                >
                  {
                    orderToProduct.product.title?.[
                      internationalization.defaultLanguage.code
                    ]
                  }
                </p>
                <p
                  style={{
                    fontFamily: "Default",
                    fontSize: "1rem",
                  }}
                >
                  Quantity: {orderToProduct.quantity}
                </p>
              </div>
            );
          },
        )}
        <p
          style={{
            fontFamily: "Default",
            fontSize: "3rem",
            margin: "1rem",
          }}
        >
          Amount:{" "}
          {
            props.data.ecommerce.order.ordersToBillingModuleCurrencies[0]
              .billingModuleCurrency.symbol
          }
          {props.data.ecommerce.order.checkoutAttributes.amount}
        </p>
        <p
          style={{
            fontFamily: "Default",
            fontSize: "1.5rem",
            width: "90%",
            margin: "0 auto",
          }}
        >
          props.data: {JSON.stringify(props.data, null, 2)}
        </p>
      </div>
    </div>
  );
}
