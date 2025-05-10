"use client";
import "client-only";

import { Component } from "./Component";
import { Skeleton } from "./Skeleton";
import { IComponentProps } from "./interface";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/client";
import { useEffect, useState } from "react";
import { api as attributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as attributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as productsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as attributesToAttributeKeysApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";

export default function Client(props: IComponentProps) {
  const [amount, setAmount] = useState<string | undefined>();

  const { data, isFetching, isLoading } = api.findById({
    id: props.data.id,
    ...props.apiProps,
  });

  useEffect(() => {
    if (props.set && typeof props.set === "function") {
      props.set(amount);
    }
  }, [data, props, amount]);

  async function getAmount() {
    if (!data) {
      return;
    }

    const priceAttributeKeys = await attributeKeyApi.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "price",
            },
          ],
        },
      },
    });

    if (!priceAttributeKeys?.length) {
      return;
    }

    const priceAttributeKey = priceAttributeKeys[0];

    const product = await productApi.findById({
      id: data.productId,
    });

    if (!product) {
      return;
    }

    const productAttributes = await productsToAttributesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: data.productId,
            },
          ],
        },
      },
    });

    if (!productAttributes) {
      return;
    }

    const attributeIds = productAttributes.map((productAttribute) => {
      return productAttribute.attributeId;
    });

    const priceAttributesToAttributeKeys =
      await attributesToAttributeKeysApi.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeKeyId",
                method: "eq",
                value: priceAttributeKey.id,
              },
              {
                column: "attributeId",
                method: "inArray",
                value: attributeIds,
              },
            ],
          },
        },
      });

    if (!priceAttributesToAttributeKeys) {
      return;
    }

    const attributes = await attributeApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: priceAttributesToAttributeKeys.map(
                (priceAttributeToAttributeKey) => {
                  return priceAttributeToAttributeKey.attributeId;
                },
              ),
            },
          ],
        },
      },
    });

    if (!attributes) {
      return;
    }

    const amount = attributes.reduce((acc, attribute) => {
      return acc + Number(attribute.number) * data.quantity;
    }, 0);

    setAmount(amount.toString());
  }

  useEffect(() => {
    if (data?.id) {
      getAmount();
    }
  }, [data?.id, data?.quantity]);

  if (isFetching || isLoading || !amount) {
    return <></>;
  }

  if (props.children && data) {
    return props.children({ data: amount });
  }

  return <></>;
}
