"use client";

import { Component as ParentComponent } from "@sps/agent/models/agent/frontend/component";

export function Component() {
  return (
    <ParentComponent
      hostUrl="/"
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            hostUrl={props.hostUrl}
            data={props.data}
            variant="admin-form"
          />
        );
      }}
    />
  );
}
