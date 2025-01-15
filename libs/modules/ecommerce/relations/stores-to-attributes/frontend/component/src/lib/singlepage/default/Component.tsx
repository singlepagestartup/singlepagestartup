import { IComponentPropsExtended } from "./interface";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="ecommerce"
      data-relation="stores-to-attributes"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <Attribute
        variant="find"
        isServer={props.isServer}
        hostUrl={props.hostUrl}
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
          return data?.map((entity, index) => {
            return (
              <Attribute
                key={index}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="default"
                data={entity}
                field={props.attributeField}
              />
            );
          });
        }}
      </Attribute>
    </div>
  );
}
