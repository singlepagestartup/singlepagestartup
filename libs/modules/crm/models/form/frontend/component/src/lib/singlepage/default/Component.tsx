import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FormsToInputs } from "@sps/crm/relations/forms-to-inputs/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="form"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <FormsToInputs
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "formId", method: "eq", value: props.data.id }],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <FormsToInputs
                key={index}
                isServer={props.isServer}
                variant={entity.variant as any}
                data={entity}
              />
            );
          });
        }}
      </FormsToInputs>
    </div>
  );
}
