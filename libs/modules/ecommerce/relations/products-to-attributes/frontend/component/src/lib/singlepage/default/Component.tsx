import { IComponentPropsExtended } from "./interface";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-relation="products-to-attributes"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Attribute
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.attributeId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity) => {
            return (
              <Attribute
                key={entity.id}
                isServer={props.isServer}
                variant="default"
                data={entity}
                field={props.attributeField}
                maximumFractionDigits={props.maximumFractionDigits}
                language={props.language}
              />
            );
          });
        }}
      </Attribute>
    </div>
  );
}
