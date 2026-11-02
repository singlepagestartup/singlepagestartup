"use client";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { FormField } from "@sps/ui-adapter";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import { ShoppingCart } from "lucide-react";
import type { IComponentPropsExtended } from "./interface";
const schema = z.object({
  quantity: z.number().int().positive(),
  productId: z.string(),
  storeId: z.string().optional(),
  billingModule: z.object({
    currency: z.object({ id: z.string().optional() }),
  }),
});
export function Component(props: IComponentPropsExtended) {
  const createOrder = api.ecommerceModuleOrderCreate({});
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [priceState, setPriceState] = useState<{
    productId: string;
    hasPrice: boolean;
  }>();
  const hasPrice =
    priceState?.productId === props.ecommerceModuleProduct.id
      ? priceState.hasPrice
      : undefined;
  const onCurrenciesResolved = useCallback(
    (currencies: unknown[]) => {
      setPriceState({
        productId: props.ecommerceModuleProduct.id,
        hasPrice: currencies.length > 0,
      });
    },
    [props.ecommerceModuleProduct.id],
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
      productId: props.ecommerceModuleProduct.id,
      storeId: props.ecommerceModuleStore?.id,
      billingModule: { currency: { id: props.billingModule?.currency?.id } },
    },
  });
  const { reset } = form;
  useEffect(() => {
    reset({
      quantity: 1,
      productId: props.ecommerceModuleProduct.id,
      storeId: props.ecommerceModuleStore?.id,
      billingModule: { currency: { id: props.billingModule?.currency?.id } },
    });
    setError("");
    setAdded(false);
  }, [
    reset,
    props.data.id,
    props.ecommerceModuleProduct.id,
    props.ecommerceModuleStore?.id,
    props.billingModule?.currency?.id,
  ]);

  async function submit(data: z.infer<typeof schema>) {
    if (hasPrice !== true) return;
    setError("");
    setAdded(false);
    try {
      await createOrder.mutateAsync({ id: props.data.id, data });
      setAdded(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : props.language === "ru"
            ? "Не удалось добавить товар."
            : "Could not add the product.",
      );
    }
  }
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0", props.className)}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="space-y-4"
          noValidate
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {props.language === "ru" ? "Валюта" : "Currency"}
              </p>
              <Product
                isServer={false}
                variant="currency-toggle-group-default"
                dataSource="props"
                data={props.ecommerceModuleProduct}
                form={form}
                formFieldName="billingModule.currency.id"
                onCurrenciesResolved={onCurrenciesResolved}
              />
            </div>
            <FormField
              ui="shadcn"
              type="number"
              name="quantity"
              min={1}
              step={1}
              form={form}
              label={props.language === "ru" ? "Количество" : "Quantity"}
              className="max-w-28"
              inputClassName="rounded-xl"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={createOrder.isPending || hasPrice !== true}
            className="min-h-11 w-full rounded-xl"
          >
            <ShoppingCart size={18} />
            {hasPrice === false
              ? props.language === "ru"
                ? "Нет цены"
                : "No price"
              : createOrder.isPending
                ? props.language === "ru"
                  ? "Добавляем…"
                  : "Adding…"
                : props.language === "ru"
                  ? "Добавить в корзину"
                  : "Add to cart"}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {added && (
            <p role="status" className="text-xs text-muted-foreground">
              {props.language === "ru"
                ? "Товар в корзине."
                : "Added to your cart."}
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
