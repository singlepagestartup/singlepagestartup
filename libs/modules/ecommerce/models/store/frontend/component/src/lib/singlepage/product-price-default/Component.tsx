import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import type { IComponentPropsExtended } from "./interface";
import { cn, formatCurrencyAmount } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  const amount = props.currencySymbol
    ? props.quote?.charges.find((charge) => charge.role === "product")?.amount
    : undefined;
  const status = props.pending
    ? "pending"
    : amount === undefined
      ? "unavailable"
      : "ready";
  const issues = props.readOnly
    ? []
    : props.quote?.issues
        .filter((issue) => issue.code !== "address_required")
        .map((issue) => ({
          id: `${issue.code}-${issue.offerId}`,
          message:
            props.language === "ru" && issue.code === "delivery_required"
              ? "Для выбранных условий заказа нет доступного способа получения."
              : issue.message,
        }));

  return (
    <div
      data-module="ecommerce"
      data-model="store"
      data-variant={props.variant}
      data-offer-id={props.selectedOffer?.id}
      data-store-id={props.selectedOffer?.storeId}
      className={cn("flex w-full flex-col gap-1", props.className)}
    >
      <Product
        isServer={props.isServer}
        variant="price-default"
        dataSource="props"
        data={props.product}
        calculatedPrice={{
          amount:
            amount === undefined
              ? undefined
              : formatCurrencyAmount(amount, props.language),
          currencySymbol: props.currencySymbol,
          status,
          issues,
        }}
        language={props.language}
      />
      {props.readOnly && props.storeTitle ? (
        <p className="text-xs text-muted-foreground">{props.storeTitle}</p>
      ) : null}
    </div>
  );
}
