import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const amount = props.quote?.charges.find(
    (charge) => charge.role === "product",
  )?.amount;
  const status = props.pending
    ? "pending"
    : props.selectionRequired
      ? "selection-required"
      : amount === undefined
        ? "unavailable"
        : "ready";
  const issues = props.quote?.issues
    .filter((issue) => issue.code !== "address_required")
    .map((issue) => ({
      id: `${issue.code}-${issue.offerId}`,
      message:
        props.language === "ru" && issue.code === "delivery_required"
          ? "Для выбранных условий заказа нет доступного способа получения."
          : issue.message,
    }));

  return (
    <Product
      isServer={props.isServer}
      variant="price-default"
      dataSource="props"
      data={props.product}
      calculatedPrice={{
        amount,
        currencySymbol: props.currencySymbol,
        status,
        issues,
      }}
      language={props.language}
      className={props.className}
    />
  );
}
