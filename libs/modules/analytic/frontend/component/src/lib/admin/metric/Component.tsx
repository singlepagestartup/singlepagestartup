"use client";

import { Component as ParentComponent } from "@sps/analytic/models/metric/frontend/component";

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
