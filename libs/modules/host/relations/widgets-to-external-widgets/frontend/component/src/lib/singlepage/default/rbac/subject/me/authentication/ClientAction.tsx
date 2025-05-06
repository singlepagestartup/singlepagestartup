"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Button } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return;
        }

        return (
          <div className="ml-auto flex flex-col w-fit p-2">
            <RbacModuleSubjectsToIdentities
              isServer={false}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: subject?.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) => {
                if (!data?.length) {
                  return (
                    <Button variant="outline" asChild={true}>
                      <Link href="/rbac/subject/authentication/select-method">
                        Login
                      </Link>
                    </Button>
                  );
                }

                return (
                  <RbacModuleSubject
                    variant="profile-button-default"
                    data={subject}
                    isServer={false}
                  />
                );
              }}
            </RbacModuleSubjectsToIdentities>
          </div>
        );
      }}
    </RbacModuleSubject>
  );
}
