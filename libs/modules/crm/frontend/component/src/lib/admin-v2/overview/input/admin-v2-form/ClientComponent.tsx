"use client";

import { Component as ParentComponent } from "@sps/crm/models/input/frontend/component";
import { Component as InputsToOptions } from "@sps/crm/relations/inputs-to-options/frontend/component";
import { Component as StepsToInputs } from "@sps/crm/relations/steps-to-inputs/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Input } from "../";
import { Component as Option } from "../../option";
import { Component as Step } from "../../step";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
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
                      column: "inputId",
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
      inputsToOptions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <InputsToOptions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Input"
            rightModelAdminFormLabel="Option"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Option
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.optionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "inputId",
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
