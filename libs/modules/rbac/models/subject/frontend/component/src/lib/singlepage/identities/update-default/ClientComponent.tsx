"use client";

import { IComponentPropsExtended } from "./interface";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as ChangePasswordCompmponent } from "./actions/ChangePasswordCompmponent";
import { Component as ChangeEmailCompmponent } from "./actions/ChangeEmailCompmponent";
import { Component as ChangeEthereumVirtualMachineCompmponent } from "./actions/ChangeEthereumVirtualMachineCompmponent";
import { useState } from "react";
import { Button } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  const [type, setType] = useState<"change-password" | "change-email">(
    "change-password",
  );

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

        return (
          <div className="w-full flex flex-col gap-3">
            {data.map((subjectToIdentity, index) => {
              return (
                <div
                  key={index}
                  className="w-full flex flex-col gap-3 p-4 border rounded-md"
                >
                  <Identity
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
                        if (identity.provider === "login_and_password") {
                          return (
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-3">
                                <Button
                                  variant={
                                    type === "change-password"
                                      ? "primary"
                                      : "outline"
                                  }
                                  onClick={() => setType("change-password")}
                                >
                                  Change Password
                                </Button>
                                <Button
                                  variant={
                                    type === "change-email"
                                      ? "primary"
                                      : "outline"
                                  }
                                  onClick={() => setType("change-email")}
                                >
                                  Change Email
                                </Button>
                              </div>
                              <div className="flex gap-3">
                                {type === "change-password" ? (
                                  <ChangePasswordCompmponent
                                    key={index}
                                    {...props}
                                    identity={identity}
                                  />
                                ) : type === "change-email" ? (
                                  <ChangeEmailCompmponent
                                    key={index}
                                    {...props}
                                    identity={identity}
                                  />
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>
                          );
                        } else if (
                          identity.provider === "ethereum_virtual_machine"
                        ) {
                          return (
                            <ChangeEthereumVirtualMachineCompmponent
                              key={index}
                              {...props}
                              identity={identity}
                            />
                          );
                        }
                        return <></>;
                      });
                    }}
                  </Identity>
                </div>
              );
            })}
          </div>
        );
      }}
    </SubjectsToIdentities>
  );
}
