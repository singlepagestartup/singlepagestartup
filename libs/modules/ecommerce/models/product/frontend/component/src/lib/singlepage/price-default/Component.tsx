import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="product"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <div className="flex flex-col gap-3">
        <ProductsToAttributes
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "productId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) => {
            if (!props.billingModuleCurrencyId) {
              return;
            }

            return (
              <Attribute
                isServer={props.isServer}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "id",
                          method: "inArray",
                          value: data?.map(
                            (productToAttribute) =>
                              productToAttribute.attributeId,
                          ),
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data }) => {
                  return data?.map((attribute, index) => {
                    return (
                      <AttributesToBillingModuleCurrencies
                        key={index}
                        isServer={props.isServer}
                        variant="find"
                        apiProps={{
                          params: {
                            filters: {
                              and: [
                                {
                                  column: "attributeId",
                                  method: "eq",
                                  value: attribute.id,
                                },
                                {
                                  column: "billingModuleCurrencyId",
                                  method: "eq",
                                  value: props.billingModuleCurrencyId,
                                },
                              ],
                            },
                          },
                        }}
                      >
                        {({ data }) => {
                          return data?.map(
                            (attributeToBillingModuleCurrency, index) => {
                              return (
                                <AttributeKeysToAttributes
                                  key={index}
                                  isServer={props.isServer}
                                  variant="find"
                                  apiProps={{
                                    params: {
                                      filters: {
                                        and: [
                                          {
                                            column: "attributeId",
                                            method: "eq",
                                            value: attribute.id,
                                          },
                                        ],
                                      },
                                    },
                                  }}
                                >
                                  {({ data: attributeKeysToAttributes }) => {
                                    return attributeKeysToAttributes?.map(
                                      (attributeKeyToAttribute, index) => {
                                        return (
                                          <AttributeKey
                                            key={index}
                                            isServer={props.isServer}
                                            variant="find"
                                            apiProps={{
                                              params: {
                                                filters: {
                                                  and: [
                                                    {
                                                      column: "id",
                                                      method: "eq",
                                                      value:
                                                        attributeKeyToAttribute.attributeKeyId,
                                                    },
                                                    {
                                                      column: "type",
                                                      method: "eq",
                                                      value: "price",
                                                    },
                                                  ],
                                                },
                                              },
                                            }}
                                          >
                                            {({ data }) => {
                                              return data?.map(
                                                (attributeKey, index) => {
                                                  return (
                                                    <Attribute
                                                      isServer={props.isServer}
                                                      variant="default"
                                                      data={attribute}
                                                      key={index}
                                                      className="w-fit flex gap-2"
                                                      field={attributeKey.field}
                                                      language={props.language}
                                                    />
                                                  );
                                                },
                                              );
                                            }}
                                          </AttributeKey>
                                        );
                                      },
                                    );
                                  }}
                                </AttributeKeysToAttributes>
                              );
                            },
                          );
                        }}
                      </AttributesToBillingModuleCurrencies>
                    );
                  });
                }}
              </Attribute>
            );
          }}
        </ProductsToAttributes>
      </div>
    </div>
  );
}
