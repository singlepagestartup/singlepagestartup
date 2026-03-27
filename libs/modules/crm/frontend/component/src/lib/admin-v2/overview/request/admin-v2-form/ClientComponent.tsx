"use client";

import { Component as ParentComponent } from "@sps/crm/models/request/frontend/component";
import { Component as FormsToRequests } from "@sps/crm/relations/forms-to-requests/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Form } from "../../form";
import { Component as Request } from "../";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
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
                      column: "requestId",
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
