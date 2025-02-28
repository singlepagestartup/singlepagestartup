import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import {
  FormField,
  FormItem,
  ToggleGroup,
  ToggleGroupItem,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="product"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-row", props.className || "")}
    >
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
          return (
            <FormField
              control={props.form.control}
              name={props.formFieldName}
              render={({ field }) => {
                return (
                  <FormItem className={props.className}>
                    <ToggleGroup
                      type="single"
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                                      ],
                                    },
                                  },
                                }}
                              >
                                {({
                                  data: attributesToBillingModuleCurrencies,
                                }) => {
                                  if (
                                    !attributesToBillingModuleCurrencies?.length
                                  ) {
                                    return;
                                  }

                                  return (
                                    <BillingCurrency
                                      isServer={props.isServer}
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
                                                    (entity) =>
                                                      entity.billingModuleCurrencyId,
                                                  ),
                                              },
                                            ],
                                          },
                                        },
                                      }}
                                    >
                                      {({ data }) => {
                                        if (!data) {
                                          return (
                                            <p>
                                              Product doesn't have price
                                              attributes connected to billing
                                              module currency.
                                            </p>
                                          );
                                        }

                                        return data.map((entity, index) => {
                                          return (
                                            <ToggleGroupItem
                                              key={index}
                                              value={entity.id}
                                            >
                                              <BillingCurrency
                                                isServer={props.isServer}
                                                variant="symbol"
                                                data={entity}
                                              />
                                            </ToggleGroupItem>
                                          );
                                        });
                                      }}
                                    </BillingCurrency>
                                  );
                                }}
                              </AttributesToBillingModuleCurrencies>
                            );
                          });
                        }}
                      </Attribute>
                    </ToggleGroup>
                  </FormItem>
                );
              }}
            />
          );
        }}
      </ProductsToAttributes>
    </div>
  );
}
