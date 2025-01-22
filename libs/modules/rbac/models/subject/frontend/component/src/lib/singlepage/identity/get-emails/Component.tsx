import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as SubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
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
            if (!props.children) {
              return;
            }

            return props.children({ data: undefined });
          }

          return data?.map((entity, index) => {
            return (
              <SubjectsToIdentities
                key={index}
                isServer={props.isServer}
                variant="get-identity-emails"
                data={entity}
              >
                {({ data }) => {
                  if (!props.children) {
                    return;
                  }

                  return props.children({ data: data });
                }}
              </SubjectsToIdentities>
            );
          });
        }}
      </SubjectsToIdentities>
    </div>
  );
}
