"use client";

import { Component as ParentComponent } from "@sps/rbac/models/action/frontend/component";
import { Component as SubjectsToActions } from "@sps/rbac/relations/subjects-to-actions/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Action } from "../";
import { Component as Subject } from "../../subject";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      subjectsToActions={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToActions
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Action"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Subject
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.subjectId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Action
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.actionId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "actionId",
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
