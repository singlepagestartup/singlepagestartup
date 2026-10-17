"use client";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as FormsToSteps } from "@sps/crm/relations/forms-to-steps/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      className={cn("min-w-0", props.data.className, props.className)}
      data-module="crm"
      data-model="form"
      data-variant={props.variant}
      data-id={props.data.id}
    >
      {!props.submitted && (
        <fieldset className="grid min-w-0 gap-5" disabled={props.pending}>
          <legend className="sr-only">
            {props.data.title?.[props.language] || "Support request"}
          </legend>
          <FormsToSteps
            isServer={false}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "formId", method: "eq", value: props.data.id },
                  ],
                },
                orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
              },
            }}
          >
            {({ data: formsToSteps }) =>
              formsToSteps?.length ? (
                formsToSteps.map((relation) => (
                  <FormsToSteps
                    key={relation.id}
                    isServer={false}
                    variant="default"
                    data={relation}
                    dataSource="props"
                    language={props.language}
                    form={props.form}
                    disabled={props.pending}
                    path={`steps.${relation.stepId}.`}
                  />
                ))
              ) : (
                <p role="alert">
                  {props.language === "ru"
                    ? "Поля формы не настроены."
                    : "Form fields are unavailable."}
                </p>
              )
            }
          </FormsToSteps>
        </fieldset>
      )}
      <div className="mt-5">{props.children}</div>
    </div>
  );
}
