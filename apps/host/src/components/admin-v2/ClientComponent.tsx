"use client";

import { Component as RbacRole } from "@sps/rbac/models/role/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacSubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { PropsWithChildren } from "react";

export function Component(props: PropsWithChildren) {
  return (
    <RbacSubject isServer={false} variant="authentication-me-default">
      {({ data: me }) => {
        if (!me) {
          return null;
        }

        return (
          <RbacRole isServer={false} variant="find">
            {({ data: roles }) => {
              const adminRole = roles?.find((role) => {
                return role.slug === "admin";
              });

              if (!adminRole) {
                return null;
              }

              return (
                <RbacSubjectsToRoles
                  isServer={false}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "subjectId",
                            method: "eq",
                            value: me.id,
                          },
                          {
                            column: "roleId",
                            method: "eq",
                            value: adminRole.id,
                          },
                        ],
                      },
                    },
                  }}
                >
                  {({ data: subjectsToRoles }) => {
                    if (!subjectsToRoles?.length) {
                      return null;
                    }

                    return props.children;
                  }}
                </RbacSubjectsToRoles>
              );
            }}
          </RbacRole>
        );
      }}
    </RbacSubject>
  );
}
