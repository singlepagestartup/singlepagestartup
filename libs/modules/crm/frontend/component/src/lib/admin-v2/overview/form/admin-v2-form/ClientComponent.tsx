"use client";

import { Component as ParentComponent } from "@sps/crm/models/form/frontend/component";
import { Component as FormsToRequests } from "@sps/crm/relations/forms-to-requests/frontend/component";
import { Component as FormsToSteps } from "@sps/crm/relations/forms-to-steps/frontend/component";
import { Component as WidgetsToForms } from "@sps/crm/relations/widgets-to-forms/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Form } from "../";
import { Component as Request } from "../../request";
import { Component as Step } from "../../step";
import { Component as Widget } from "../../widget";

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
                      column: "formId",
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
      widgetsToForms={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToForms
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Form"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Widget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.widgetId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
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
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "formId",
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
      formsToRequests={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <FormsToRequests
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Form"
            rightModelAdminFormLabel="Request"
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
                <Request
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.requestId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "formId",
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
