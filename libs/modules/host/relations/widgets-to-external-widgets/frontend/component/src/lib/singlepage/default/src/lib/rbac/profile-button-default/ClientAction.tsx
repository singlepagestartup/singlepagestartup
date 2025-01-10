"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Button } from "@sps/shared-ui-shadcn";
import Link from "next/link";

export function Component(props: ISpsComponentBase) {
  return (
    <Subject
      isServer={false}
      hostUrl={props.hostUrl}
      variant="authentication-me-default"
    >
      {({ data: subject }) => {
        if (!subject) {
          return;
        }

        return (
          <div className="ml-auto flex flex-col w-fit p-2">
            <SubjectsToIdentities
              isServer={false}
              hostUrl={props.hostUrl}
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
                  <Subject
                    variant="profile-button-default"
                    data={subject}
                    isServer={false}
                    hostUrl={props.hostUrl}
                  />
                );
              }}
            </SubjectsToIdentities>
          </div>
        );
      }}
    </Subject>
  );
}
