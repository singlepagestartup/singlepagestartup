import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as SubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/frontend/component";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { Component as LogoutButton } from "../authentication/logout-button-default";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sps/shared-ui-shadcn";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>
          <Button variant="outline">
            <SubjectsToIdentities
              isServer={props.isServer}
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
                    >
                      {({ data }) => {
                        return data?.map((identity) => {
                          return identity.email;
                        });
                      }}
                    </Identity>
                  );
                });
              }}
            </SubjectsToIdentities>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="space-y-2">
          <DropdownMenuLabel>
            <SubjectsToRoles
              isServer={props.isServer}
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
                      key={index}
                      isServer={props.isServer}
                      variant="default"
                      data={{
                        id: subjectToRole.roleId,
                      }}
                    />
                  );
                });
              }}
            </SubjectsToRoles>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/rbac/subjects/settings">Settings</Link>
          </DropdownMenuItem>
          <LogoutButton
            isServer={props.isServer}
            variant="authentication-logout-button-default"
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
