"use client";

import { Component as ParentComponent } from "@sps/rbac/models/act/frontend/component";
import { Component as SubjectsToActs } from "@sps/rbac/relations/subjects-to-acts/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            subjectsToActs={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToActs
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "actId",
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
      }}
    />
  );
}
