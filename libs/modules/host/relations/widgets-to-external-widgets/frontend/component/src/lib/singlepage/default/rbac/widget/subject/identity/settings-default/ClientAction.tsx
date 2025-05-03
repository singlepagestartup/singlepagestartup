"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <Subject isServer={false} variant="authentication-me-default">
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Subject
            isServer={false}
            variant="identity-settings-default"
            data={{
              id: data.id,
            }}
          />
        );
      }}
    </Subject>
  );
}
