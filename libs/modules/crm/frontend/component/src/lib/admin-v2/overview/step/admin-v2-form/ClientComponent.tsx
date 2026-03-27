"use client";

import { Component as ParentComponent } from "@sps/crm/models/step/frontend/component";
import { Component as FormsToSteps } from "@sps/crm/relations/forms-to-steps/frontend/component";
import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Form } from "../../form";
import { Component as Input } from "../../input";
import { Component as Step } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      formsToSteps={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <FormsToSteps
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Form"
            rightModelAdminFormLabel="Step"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Form
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.formId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Step
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.stepId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "stepId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      stepsToInputs={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <StepsToInputs
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Step"
            rightModelAdminFormLabel="Input"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Step
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.stepId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Input
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.inputId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "stepId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
