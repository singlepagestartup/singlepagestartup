"use client";

import { Component as ParentComponent } from "@sps/rbac/models/session/frontend/component";
import { Component as SubjectsToSessions } from "@sps/rbac/relations/subjects-to-sessions/frontend/component";

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
            subjectsToSessions={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <SubjectsToSessions
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "sessionId",
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
