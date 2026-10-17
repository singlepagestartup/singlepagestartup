import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Step } from "@sps/crm/models/step/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-relation="forms-to-steps"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Step
        variant="find"
        isServer={props.isServer}
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.stepId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Step
                key={entity.id}
                isServer={props.isServer}
                variant="default"
                data={entity}
                dataSource="props"
                language={props.language}
                form={props.form}
                disabled={props.disabled}
                path={props.path}
              />
            );
          });
        }}
      </Step>
    </div>
  );
}
