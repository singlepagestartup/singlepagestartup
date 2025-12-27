import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Input } from "@sps/crm/models/input/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-relation="steps-to-inputs"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Input
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.inputId,
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
                form={props.form}
                disabled={props.disabled}
                language={props.language}
                path={props.path}
              />
            );
          });
        }}
      </Input>
    </div>
  );
}
