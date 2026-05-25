"use client";

import { Component as ParentComponent } from "@sps/social/models/skill/frontend/component";

import { Component as ProfilesToSkills } from "@sps/social/relations/profiles-to-skills/frontend/component";

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
            profilesToSkills={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProfilesToSkills
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "skillId",
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
