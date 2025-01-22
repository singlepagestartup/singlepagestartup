import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-identities"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Identity
        isServer={props.isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: props.data.identityId,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          if (data && data?.length > 1) {
            throw new Error("More than one identity found");
          }

          if (!props.children) {
            return;
          }

          if (!data || data.length === 0) {
            props.children({ data: undefined });
          }

          if (data?.length) {
            return props.children({ data: data[0].email });
          }
        }}
      </Identity>
    </div>
  );
}
