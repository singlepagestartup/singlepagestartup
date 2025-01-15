import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-model="attribute"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-row gap-0.5", props.className || "")}
    >
      <p>{props.data[props.field]}</p>
      <AttributesToBillingModuleCurrencies
        isServer={props.isServer}
        hostUrl={props.hostUrl}
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
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="default"
                data={entity}
              />
            );
          });
        }}
      </AttributesToBillingModuleCurrencies>
    </div>
  );
}
