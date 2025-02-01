import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Input } from "@sps/crm/models/input/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-relation="forms-to-inputs"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    >
      <Input
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data?.inputId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Input
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </Input>
    </div>
  );
}
