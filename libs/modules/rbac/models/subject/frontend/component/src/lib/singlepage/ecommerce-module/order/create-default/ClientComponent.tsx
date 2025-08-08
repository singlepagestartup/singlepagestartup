"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { cn } from "@sps/shared-frontend-client-utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
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

  async function onSubmit(data: z.infer<typeof formSchema>) {
    ecommerceProductsCart.mutate({
      id: props.data.id,
      data,
    });
  }

  useEffect(() => {
    if (ecommerceProductsCart.isSuccess) {
      toast.success("Updated successfully");
    }
  }, [ecommerceProductsCart.isSuccess]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
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
                {({ data: attributesToBillingModuleCurrencies }) => {
                  return (
                    <BillingModuleCurrency
                      isServer={false}
                      variant="find"
                      apiProps={{
                        params: {
                          filters: {
                            and: [
                              {
                                column: "id",
                                method: "inArray",
                                value:
                                  attributesToBillingModuleCurrencies?.map(
                                    (attributeToBillingModuleCurrency) =>
                                      attributeToBillingModuleCurrency.billingModuleCurrencyId,
                                  ) || [],
                              },
                            ],
                          },
                        },
                      }}
                    >
                      {({ data: billingModuleCurrencies }) => {
                        if (!billingModuleCurrencies) {
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
                              options={billingModuleCurrencies.map((entity) => [
                                entity.id,
                                entity.symbol,
                              ])}
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
        </ProductsToAttributes>
        <div className="flex w-full gap-1">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            variant="secondary"
            className="w-full flex flex-shrink-0"
            disabled={ecommerceProductsCart.isPending}
          >
            {ecommerceProductsCart.isPending ? "Adding..." : "Add to cart"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
