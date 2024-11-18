import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col")}
    >
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
                    hostUrl={props.hostUrl}
                    variant="update-default"
                    data={{
                      id: subjectToIdentity.identityId,
                    }}
                  />
                );
              })}
            </div>
          );
        }}
      </SubjectsToIdentities>
    </div>
  );
}
