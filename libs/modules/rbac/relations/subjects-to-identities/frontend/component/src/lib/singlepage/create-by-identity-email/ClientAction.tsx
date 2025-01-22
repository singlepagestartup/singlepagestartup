"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Identity } from "@sps/rbac/models/identity/frontend/component";
import { api } from "@sps/rbac/relations/subjects-to-identities/sdk/client";

export function Component(props: IComponentPropsExtended) {
  const createEntity = api.create();

  return (
    <div
      data-module="rbac"
      data-relation="subjects-to-identities"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Identity
        isServer={false}
        variant="create-by-email"
        successCallback={(data) => {
          createEntity.mutate({
            data: {
              identityId: data.id,
              subjectId: props.subjectId,
            },
          });
        }}
      />
    </div>
  );
}
