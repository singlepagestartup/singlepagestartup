"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as SubjectsToEcommerceModuleOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as DeleteDefault } from "../../delete-default";
import { Component as UpdateDefault } from "../../update-default";
import { Component as TotalDefault } from "../total-default";

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "cloudpayments",
  "dummy",
] as const;

const formSchema = z.object({
  provider: z
    .string()
    .refine(
      (value) =>
        value === "stripe" ||
        value === "0xprocessing" ||
        value === "payselection" ||
        value === "cloudpayments" ||
        value === "dummy",
      "Invalid provider",
    ),
  email: z.string().email(),
  billingModule: z.object({
    currency: z.object({
      id: z.string(),
    }),
  }),
  ecommerceModule: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
      }),
    ),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
      billingModule: {
        currency: {
          id: undefined,
        },
      },
      ecommerceModule: {
        orders: [],
      },
    },
  });

  const watch = form.watch();

  async function onSubmit(data: z.infer<typeof formSchema>) {
    ecommerceModuleOrderCheckout
      .mutateAsync({
        id: props.data.id,
        data,
      })
      .then((res) => {
        const paymentUrl = res.billingModule.invoices[0].paymentUrl;
        window.location.href = paymentUrl;
      });
  }

  return (
    <Form
      data-module="rbac"
      data-model="subject"
      data-model-id={props.data.id}
      data-variant={props.data.variant}
      {...form}
    >
      <div className="flex flex-col w-full gap-2">
        <SubjectsToEcommerceModuleOrders
          isServer={false}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: props.data.id,
                  },
                ],
              },
            },
          }}
        >
          {({ data: subjectsToEcommerceModuleOrders }) => {
            return (
              <EcommerceModuleOrder
                isServer={false}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "id",
                          method: "inArray",
                          value: subjectsToEcommerceModuleOrders?.map(
                            (entity) => entity.ecommerceModuleOrderId,
                          ),
                        },
                        {
                          column: "type",
                          method: "eq",
                          value: "cart",
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: ecommerceModuleOrders }) => {
                  return (
                    <div className="flex flex-col gap-1">
                      {ecommerceModuleOrders?.map(
                        (ecommerceModuleOrder, index) => {
                          return (
                            <EcommerceModuleOrder
                              key={index}
                              isServer={false}
                              variant="cart-default"
                              data={ecommerceModuleOrder}
                              language={props.language}
                              billingModuleCurrencyId={form.getValues(
                                "billingModule.currency.id",
                              )}
                            >
                              <>
                                <EcommerceModuleOrder
                                  key={index}
                                  isServer={false}
                                  variant="form-field-default"
                                  data={ecommerceModuleOrder}
                                  formFieldName={`ecommerceModule.orders.${index}.id`}
                                  entityFieldName="id"
                                  form={form}
                                />
                                <UpdateDefault
                                  isServer={false}
                                  variant="ecommerce-module-order-update-default"
                                  data={props.data}
                                  language={props.language}
                                  order={ecommerceModuleOrder}
                                />
                                <DeleteDefault
                                  isServer={false}
                                  variant="ecommerce-module-order-delete-default"
                                  data={props.data}
                                  language={props.language}
                                  order={ecommerceModuleOrder}
                                />
                              </>
                            </EcommerceModuleOrder>
                          );
                        },
                      )}
                    </div>
                  );
                }}
              </EcommerceModuleOrder>
            );
          }}
        </SubjectsToEcommerceModuleOrders>
        <TotalDefault
          isServer={false}
          variant="ecommerce-module-order-list-total-default"
          data={props.data}
          language={props.language}
        >
          {({ data: totals }) => {
            return totals
              ?.filter((total) => {
                return (
                  total.billingModuleCurrency.id ===
                  watch.billingModule.currency.id
                );
              })
              ?.map((total, index) => {
                return (
                  <p key={index} className="text-lg font-bold">
                    {total.total}
                    {total.billingModuleCurrency.symbol}
                  </p>
                );
              });
          }}
        </TotalDefault>
        <BillingCurrency
          isServer={false}
          variant="toggle-group-default"
          form={form}
          formFieldName="billingModule.currency.id"
          className="w-fit"
        />
        <FormField
          ui="shadcn"
          type="select"
          name="provider"
          form={form}
          placeholder="Select provider"
          options={providers.map((provider) => [provider, provider])}
        />
        <FormField
          ui="shadcn"
          type="text"
          name="email"
          form={form}
          placeholder="Email for invoice"
        />
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="primary"
          className="w-full flex flex-shrink-0"
          disabled={ecommerceModuleOrderCheckout.isPending}
        >
          Checkout
        </Button>
      </div>
    </Form>
  );
}
