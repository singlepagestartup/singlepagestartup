import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";

export function Component(props: IComponentPropsExtended) {
  const raw =
    props.field === "string"
      ? props.data.string?.[props.language]
      : props.data[props.field as keyof typeof props.data];
  const numericValue =
    typeof raw === "number"
      ? raw
      : props.field === "number" && typeof raw === "string" && raw.trim()
        ? Number(raw)
        : undefined;
  const value =
    numericValue !== undefined &&
    Number.isFinite(numericValue) &&
    props.maximumFractionDigits !== undefined
      ? new Intl.NumberFormat(props.language === "ru" ? "ru-RU" : "en-US", {
          maximumFractionDigits: props.maximumFractionDigits,
        }).format(numericValue)
      : raw instanceof Date
        ? raw.toLocaleString(props.language === "ru" ? "ru-RU" : "en-US")
        : typeof raw === "boolean"
          ? raw
            ? props.language === "ru"
              ? "Да"
              : "Yes"
            : props.language === "ru"
              ? "Нет"
              : "No"
          : raw == null
            ? "—"
            : typeof raw === "object"
              ? JSON.stringify(raw)
              : String(raw);
  return (
    <div
      data-module="ecommerce"
      data-model="attribute"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "flex min-w-0 flex-wrap items-baseline gap-1 break-words",
        props.className,
      )}
    >
      <p>{value}</p>
      <AttributesToBillingModuleCurrencies
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <AttributesToBillingModuleCurrencies
                key={entity.id}
                isServer={props.isServer}
                variant="default"
                dataSource="props"
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </AttributesToBillingModuleCurrencies>
    </div>
  );
}
