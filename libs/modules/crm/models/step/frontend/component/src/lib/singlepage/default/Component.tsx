import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="step"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <div className="w-full grid gap-4">
        <StepsToInputs
          isServer={false}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "stepId",
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
                <StepsToInputs
                  key={index}
                  isServer={false}
                  variant={entity.variant as any}
                  data={entity}
                  form={props.form}
                  disabled={props.disabled}
                  language={props.language}
                  path={`${props.path}inputs.[${index}].`}
                />
              );
            });
          }}
        </StepsToInputs>
      </div>
    </div>
  );
}
