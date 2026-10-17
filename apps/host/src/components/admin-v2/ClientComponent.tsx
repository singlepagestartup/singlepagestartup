"use client";

import { Component as RbacRole } from "@sps/rbac/models/role/frontend/component";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacSubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { PropsWithChildren } from "react";
import { Component as Access } from "../admin/access";

export function Component(props: PropsWithChildren) {
  return (
    <RbacSubject isServer={false} variant="authentication-me-default">
      {({ data: me, authenticated }) => {
        if (!me || !authenticated) {
          return null;
        }

        return (
          <Access subjectId={me.id}>
            <RbacSubjectsToRoles
              isServer={false}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [{ column: "subjectId", method: "eq", value: me.id }],
                  },
                },
              }}
            >
              {({ data: subjectsToRoles }) => {
                if (!subjectsToRoles?.length) {
                  return null;
                }

                return (
                  <RbacRole
                    isServer={false}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "inArray",
                              value: subjectsToRoles.map(
                                (relation) => relation.roleId,
                              ),
                            },
                            {
                              column: "slug",
                              method: "eq",
                              value: "admin",
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: roles }) => {
                      if (!roles?.length) {
                        return null;
                      }

                      return props.children;
                    }}
                  </RbacRole>
                );
              }}
            </RbacSubjectsToRoles>
          </Access>
        );
      }}
    </RbacSubject>
  );
}
