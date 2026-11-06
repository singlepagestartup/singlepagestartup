import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { TipTap } from "@sps/shared-ui-shadcn";
import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="crm"
      data-model="step"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full min-w-0 space-y-5 rounded-2xl bg-muted p-5 sm:p-6",
        props.data.className,
        props.className,
      )}
    >
      {props.data.title?.[props.language] || props.data.title?.en ? (
        <h3 className="text-base font-semibold">
          {props.data.title?.[props.language] || props.data.title?.en}
        </h3>
      ) : null}
      {props.data.subtitle?.[props.language] || props.data.subtitle?.en ? (
        <TipTap
          value={
            props.data.subtitle?.[props.language] ||
            props.data.subtitle?.en ||
            ""
          }
          className="text-sm leading-6 text-muted-foreground"
        />
      ) : null}
      {props.data.description?.[props.language] ||
      props.data.description?.en ? (
        <TipTap
          value={
            props.data.description?.[props.language] ||
            props.data.description?.en ||
            ""
          }
          className="text-sm leading-6 text-muted-foreground"
        />
      ) : null}
      <div className="grid w-full min-w-0 gap-5 sm:grid-cols-2">
        <StepsToInputs
          isServer={false}
          variant="find"
          apiProps={{
            params: {
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
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
                  key={entity.id}
                  isServer={false}
                  variant={entity.variant as any}
                  data={entity}
                  dataSource="props"
                  form={props.form}
                  disabled={props.disabled}
                  language={props.language}
                  path={`${props.path}inputs.${entity.inputId}.`}
                />
              );
            });
          }}
        </StepsToInputs>
      </div>
    </div>
  );
}
