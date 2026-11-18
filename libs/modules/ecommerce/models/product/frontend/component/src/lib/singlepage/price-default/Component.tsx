import type { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Attributes } from "./Attributes";

export function Component(props: IComponentPropsExtended) {
  if (!props.calculatedPrice) {
    return <Attributes {...props} />;
  }
  const price = props.calculatedPrice;
  return (
    <div
      data-module="ecommerce"
      data-model="product"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-1", props.className)}
    >
      {price.amount !== undefined ? (
        <p className="font-semibold tabular-nums">
          {price.amount} {price.currencySymbol}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {price.status === "pending"
            ? props.language === "ru"
              ? "Рассчитываем…"
              : "Calculating…"
            : price.status === "selection-required"
              ? props.language === "ru"
                ? "Выберите магазин"
                : "Choose a store"
              : props.language === "ru"
                ? "Невозможно рассчитать"
                : "Cannot calculate"}
        </p>
      )}
      {price.issues?.map((issue) => (
        <p key={issue.id} className="text-xs text-destructive">
          {issue.message}
        </p>
      ))}
    </div>
  );
}
