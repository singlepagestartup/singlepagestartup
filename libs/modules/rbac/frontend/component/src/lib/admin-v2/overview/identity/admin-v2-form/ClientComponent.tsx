"use client";

import { Component as ParentComponent } from "@sps/rbac/models/identity/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Identity } from "../";
import { Component as Subject } from "../../subject";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      subjectsToIdentities={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <SubjectsToIdentities
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Subject"
            rightModelAdminFormLabel="Identity"
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
                <Identity
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.identityId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "identityId",
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
