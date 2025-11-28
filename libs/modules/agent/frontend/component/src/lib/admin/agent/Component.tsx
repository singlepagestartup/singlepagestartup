"use client";

import { Component as ParentComponent } from "@sps/agent/models/agent/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
          />
        );
      }}
    />
  );
}
