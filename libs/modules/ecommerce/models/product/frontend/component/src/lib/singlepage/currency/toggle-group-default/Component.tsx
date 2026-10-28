import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as AttributesToCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as Currency } from "@sps/billing/models/currency/frontend/component";
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
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("min-w-0", props.className)}
    >
      <AttributeKey
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "type", method: "eq", value: "price" }],
            },
          },
        }}
      >
        {({ data: keys }) =>
          !keys?.length ? null : (
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
              {({ data: productLinks }) =>
                !productLinks?.length ? null : (
                  <AttributeKeysToAttributes
                    isServer={props.isServer}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "attributeKeyId",
                              method: "inArray",
                              value: keys.map((key) => key.id),
                            },
                            {
                              column: "attributeId",
                              method: "inArray",
                              value: productLinks.map(
                                (link) => link.attributeId,
                              ),
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: keyLinks }) =>
                      !keyLinks?.length ? null : (
                        <AttributesToCurrencies
                          isServer={props.isServer}
                          variant="find"
                          apiProps={{
                            params: {
                              filters: {
                                and: [
                                  {
                                    column: "attributeId",
                                    method: "inArray",
                                    value: keyLinks.map(
                                      (link) => link.attributeId,
                                    ),
                                  },
                                ],
                              },
                            },
                          }}
                        >
                          {({ data: currencyLinks }) =>
                            !currencyLinks?.length ? null : (
                              <Currency
                                isServer={props.isServer}
                                variant="find"
                                apiProps={{
                                  params: {
                                    filters: {
                                      and: [
                                        {
                                          column: "id",
                                          method: "inArray",
                                          value: [
                                            ...new Set(
                                              currencyLinks.map(
                                                (link) =>
                                                  link.billingModuleCurrencyId,
                                              ),
                                            ),
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                }}
                              >
                                {({ data: currencies }) =>
                                  !currencies?.length ? null : (
                                    <FormField
                                      control={props.form.control}
                                      name={props.formFieldName}
                                      render={({ field }) => (
                                        <FormItem>
                                          <ToggleGroup
                                            type="single"
                                            value={field.value || ""}
                                            onValueChange={(value) => {
                                              if (value) field.onChange(value);
                                            }}
                                            className="flex flex-wrap justify-start gap-1 rounded-xl bg-muted p-1"
                                          >
                                            {currencies.map((currency) => (
                                              <ToggleGroupItem
                                                key={currency.id}
                                                value={currency.id}
                                                aria-label={
                                                  currency.title ||
                                                  currency.symbol ||
                                                  currency.id
                                                }
                                                className="min-h-9 min-w-11 rounded-lg px-3 text-sm data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                                              >
                                                <Currency
                                                  isServer={props.isServer}
                                                  variant="symbol"
                                                  dataSource="props"
                                                  data={currency}
                                                />
                                              </ToggleGroupItem>
                                            ))}
                                          </ToggleGroup>
                                        </FormItem>
                                      )}
                                    />
                                  )
                                }
                              </Currency>
                            )
                          }
                        </AttributesToCurrencies>
                      )
                    }
                  </AttributeKeysToAttributes>
                )
              }
            </ProductsToAttributes>
          )
        }
      </AttributeKey>
    </div>
  );
}
