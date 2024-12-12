import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as SubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { Component as LogoutButton } from "../../../logout-button";
import { Button } from "@sps/shared-ui-shadcn";
import Link from "next/link";
import { Component as Role } from "@sps/rbac/models/role/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className || "")}
    >
      <p>{props.data.id}</p>
      <Button variant="outline" asChild={true}>
        <Link href="/rbac/settings">Settings</Link>
      </Button>
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
          return data?.map((subjectToIdentity, index) => {
            return (
              <Identity
                key={index}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "id",
                          method: "eq",
                          value: subjectToIdentity.identityId,
                        },
                      ],
                    },
                  },
                }}
                isServer={props.isServer}
                hostUrl={props.hostUrl}
              >
                {({ data }) => {
                  return data?.map((identity, index) => {
                    return (
                      <div key={index} className="flex flex-col gap-1 text-xs">
                        <div>{identity.email}</div>
                      </div>
                    );
                  });
                }}
              </Identity>
            );
          });
        }}
      </SubjectsToIdentities>
      <SubjectsToRoles
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
          return data?.map((subjectToRole, index) => {
            return (
              <Role
                isServer={props.isServer}
                hostUrl={props.hostUrl}
                variant="default"
                data={{
                  id: subjectToRole.roleId,
                }}
              />
            );
          });
        }}
      </SubjectsToRoles>
      <LogoutButton
        hostUrl={props.hostUrl}
        isServer={props.isServer}
        variant="logout-button"
      />
    </div>
  );
}
