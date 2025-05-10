import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { Component as SocialModuleProfileListDefault } from "../social-module/profile/list/default/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col gap-1")}
    >
      <p className="font-bold text-4xl">Id: {props.data.id}</p>
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
          if (!data?.length) {
            return;
          }

          return (
            <div className="w-full flex flex-col gap-3">
              {data.map((subjectToIdentity, index) => {
                return (
                  <Identity
                    key={index}
                    isServer={props.isServer}
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
                    {({ data: identitities }) => {
                      return identitities?.map((identity, index) => {
                        return (
                          <Identity
                            key={index}
                            isServer={props.isServer}
                            variant="default"
                            data={identity}
                          />
                        );
                      });
                    }}
                  </Identity>
                );
              })}
            </div>
          );
        }}
      </SubjectsToIdentities>
      <SocialModuleProfileListDefault
        isServer={props.isServer}
        variant="social-module-profiles-list-default"
        data={props.data}
        language={props.language}
      />
    </div>
  );
}
