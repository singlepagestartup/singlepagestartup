"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "payselection-international",
  "tiptoppay",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;

const formSchema = z.object({
  provider: z
    .string()
    .refine(
      (value) =>
        value === "stripe" ||
        value === "0xprocessing" ||
        value === "payselection" ||
        value === "payselection-international" ||
        value === "cloudpayments" ||
        value === "tiptoppay" ||
        value === "dummy" ||
        value === "paykeeper",
      "Invalid provider",
    ),
  email: z.string().email(),
  quantity: z.number().int().positive(),
  comment: z.string().optional(),
  storeId: z.string().optional(),
  billingModule: z.object({
    currency: z.object({
      id: z.string().optional(),
    }),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const productCheckout = api.ecommerceModuleProductCheckout({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "dummy",
      email: "",
      quantity: 1,
      comment: "",
      storeId: props.store?.id || undefined,
      billingModule: {
        currency: {
          id: undefined,
        },
      },
    },
  });

  const watchData = form.watch();

  console.log("🚀 ~ Component ~ watchData:", watchData);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    productCheckout
      .mutateAsync({
        id: props.data.id,
        productId: props.product.id,
        data,
      })
      .then((result) => {
        const paymentUrl = result.billingModule.invoices[0].paymentUrl;
        window.location.href = paymentUrl;
      });
  }

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-2">
          <EcommerceProduct
            isServer={false}
            variant="currency-toggle-group-default"
            form={form}
            formFieldName="billingModule.currency.id"
            className="w-fit"
            data={props.product}
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
            placeholder="Email for a bill"
            className="w-full"
          />
          <FormField
            ui="shadcn"
            type="text"
            name="comment"
            form={form}
            placeholder="Comment"
            className="w-full"
          />

          <Button
            onClick={form.handleSubmit(onSubmit)}
            variant="primary"
            disabled={productCheckout.isPending}
          >
            <div className="w-full flex justify-center items-center gap-1">
              One step checkout
              {form.watch("billingModule.currency.id") ? (
                <div className="w-fit flex items-center gap-2">
                  for
                  <EcommerceProduct
                    isServer={false}
                    variant="price-default"
                    data={props.product}
                    className="text-white"
                    billingModuleCurrencyId={form.watch(
                      "billingModule.currency.id",
                    )}
                    language={props.language}
                  />
                </div>
              ) : null}
            </div>
          </Button>
        </div>
      </Form>
    </div>
  );
}
