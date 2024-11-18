"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: ISpsComponentBase) {
  return (
    <Subject isServer={false} hostUrl={props.hostUrl} variant="me">
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Subject
            isServer={false}
            hostUrl={props.hostUrl}
            variant="identities-update-default"
            data={{
              id: data.id,
            }}
          />
        );
      }}
    </Subject>
  );
}
