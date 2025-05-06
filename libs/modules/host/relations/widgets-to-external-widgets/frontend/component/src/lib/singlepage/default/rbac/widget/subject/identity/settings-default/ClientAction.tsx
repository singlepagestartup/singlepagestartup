"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <RbacModuleSubject
            isServer={false}
            variant="identity-settings-default"
            data={{
              id: data.id,
            }}
          />
        );
      }}
    </RbacModuleSubject>
  );
}
