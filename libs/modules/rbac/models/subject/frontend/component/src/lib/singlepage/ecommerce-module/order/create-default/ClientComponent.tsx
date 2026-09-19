"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { cn } from "@sps/shared-frontend-client-utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Form } from "@sps/shared-ui-shadcn";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { AddToCartButton } from "./AddToCartButton";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { FormField } from "@sps/ui-adapter";

const formSchema = z.object({
  quantity: z.number(),
  productId: z.string(),
  storeId: z.string().optional(),
  billingModule: z.object({
    currency: z.object({
      id: z.string().optional(),
    }),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const ecommerceProductsCart = api.ecommerceModuleOrderCreate({});
  const { mutate, isPending, isSuccess } = ecommerceProductsCart;

  /**
   * `undefined` until the product's price currencies are known. A product with
   * no price in any currency cannot be ordered, so the control stays disabled
   * instead of sending a request the API rejects.
   */
  const [billingModuleCurrencies, setBillingModuleCurrencies] = useState<
    IBillingModuleCurrency[] | undefined
  >(undefined);

  const hasPrice =
    billingModuleCurrencies === undefined
      ? undefined
      : billingModuleCurrencies.length > 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      productId: props.product.id,
      storeId: props.store?.id || undefined,
      billingModule: {
        currency: {
          id: props.billingModule?.currency?.id || undefined,
        },
      },
    },
  });

  const onSubmit = useCallback(
    (data: z.infer<typeof formSchema>) => {
      mutate({
        id: props.data.id,
        data,
      });
    },
    [mutate, props.data.id],
  );

  const onAddToCart = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Updated successfully");
    }
  }, [isSuccess]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <input
          type="hidden"
          {...form.register("quantity", {
            valueAsNumber: true,
          })}
        />
        <input type="hidden" {...form.register("productId")} />
        <input type="hidden" {...form.register("storeId")} />
        <input type="hidden" {...form.register("billingModule.currency.id")} />

        <AttributeKey
          isServer={false}
          variant="find"
          apiProps={{
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
          }}
        >
          {({ data: attributeKeys }) => {
            return (
              <ProductsToAttributes
                isServer={false}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "productId",
                          method: "eq",
                          value: props.product.id,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: productsToAttributes }) => {
                  return (
                    <AttributeKeysToAttributes
                      isServer={false}
                      variant="find"
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "attributeKeyId",
                                method: "inArray",
                                value:
                                  attributeKeys?.map(
                                    (attributeKey) => attributeKey.id,
                                  ) || [],
                              },
                              {
                                column: "attributeId",
                                method: "inArray",
                                value:
                                  productsToAttributes?.map(
                                    (productToAttribute) =>
                                      productToAttribute.attributeId,
                                  ) || [],
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data: attributeKeysToAttributes }) => {
                        return (
                          <AttributesToBillingModuleCurrencies
                            isServer={false}
                            variant="find"
                            apiProps={{
                              params: {
                                filters: {
                                  and: [
                                    {
                                      column: "attributeId",
                                      method: "inArray",
                                      value:
                                        attributeKeysToAttributes?.map(
                                          (productToAttribute) =>
                                            productToAttribute.attributeId,
                                        ) || [],
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({
                              data: attributesToBillingModuleCurrencies,
                            }) => {
                              return (
                                <BillingModuleCurrency
                                  isServer={false}
                                  variant="find"
                                  set={setBillingModuleCurrencies}
                                  apiProps={{
                                    params: {
                                      filters: {
                                        and: [
                                          {
                                            column: "id",
                                            method: "inArray",
                                            value:
                                              attributesToBillingModuleCurrencies?.map(
                                                (
                                                  attributeToBillingModuleCurrency,
                                                ) =>
                                                  attributeToBillingModuleCurrency.billingModuleCurrencyId,
                                              ) || [],
                                          },
                                        ],
                                      },
                                    },
                                  }}
                                >
                                  {({ data: billingModuleCurrencies }) => {
                                    if (!billingModuleCurrencies?.length) {
                                      return null;
                                    }

                                    return (
                                      <div className="flex flex-col gap-2">
                                        <FormField
                                          ui="shadcn"
                                          type="toggle-group"
                                          label=""
                                          name="billingModule.currency.id"
                                          form={form}
                                          options={billingModuleCurrencies.map(
                                            (entity) => [
                                              entity.id,
                                              entity.symbol,
                                            ],
                                          )}
                                        />
                                      </div>
                                    );
                                  }}
                                </BillingModuleCurrency>
                              );
                            }}
                          </AttributesToBillingModuleCurrencies>
                        );
                      }}
                    </AttributeKeysToAttributes>
                  );
                }}
              </ProductsToAttributes>
            );
          }}
        </AttributeKey>

        <div className="flex w-full gap-1">
          <AddToCartButton
            hasPrice={hasPrice}
            isPending={isPending}
            onClick={onAddToCart}
          />
        </div>
      </Form>
    </div>
  );
}
