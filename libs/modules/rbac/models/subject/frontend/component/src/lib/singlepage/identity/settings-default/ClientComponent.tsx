import { IComponentPropsExtended } from "./interface";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as ChangePasswordCompmponent } from "./actions/ChangePasswordCompmponent";
import { Component as ChangeEmailCompmponent } from "./actions/ChangeEmailCompmponent";
import { Component as ChangeEthereumVirtualMachineCompmponent } from "./actions/ChangeEthereumVirtualMachineCompmponent";
import { Badge, Button } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
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
                value: props.data.id,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        if (!data?.length) {
          return;
        }

        return data.map((subjectToIdentity, index) => {
          return (
            <Identity
              key={index}
              isServer={false}
              hostUrl={props.hostUrl}
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
            >
              {({ data }) => {
                return data?.map((identity, index) => {
                  return (
                    <div
                      key={index}
                      className="w-full grid grid-cols-4 gap-4 items-center"
                    >
                      <div className="col-span-1">
                        <Badge variant="outline">
                          {identity.provider === "email_and_password"
                            ? "Email"
                            : "EVM"}
                        </Badge>
                      </div>
                      <div className="col-span-1">
                        <p className="text-sm font-medium leading-none">
                          {identity.email}
                        </p>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-3">
                        <ChangeEmailCompmponent
                          isServer={props.isServer}
                          data={props.data}
                          identity={identity}
                          hostUrl={props.hostUrl}
                          variant={props.variant}
                        />
                        <ChangePasswordCompmponent
                          isServer={props.isServer}
                          data={props.data}
                          identity={identity}
                          hostUrl={props.hostUrl}
                          variant={props.variant}
                        />
                        <Button variant="destructive" className="w-fit">
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                });
              }}
            </Identity>
          );
        });
      }}
    </SubjectsToIdentities>
  );
}
