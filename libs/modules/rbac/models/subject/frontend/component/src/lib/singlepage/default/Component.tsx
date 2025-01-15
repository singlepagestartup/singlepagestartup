import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <SubjectsToIdentities
            isServer={props.isServer}
            hostUrl={props.hostUrl}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: props.data.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <Identity
                    key={index}
                    isServer={props.isServer}
                    hostUrl={props.hostUrl}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "eq",
                              value: entity.identityId,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data }) => {
                      return data?.map((entity, index) => {
                        return (
                          <p
                            key={index}
                            className="text-sm font-medium leading-none"
                          >
                            {entity.email}
                          </p>
                        );
                      });
                    }}
                  </Identity>
                );
              });
            }}
          </SubjectsToIdentities>
        </div>
        <Button variant="outline" asChild={true} className="w-fit">
          <Link href={`/rbac/subjects/${props.data.id}`}>View profile</Link>
        </Button>
      </div>
    </div>
  );
}