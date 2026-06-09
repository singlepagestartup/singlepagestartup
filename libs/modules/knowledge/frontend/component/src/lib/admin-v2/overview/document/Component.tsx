"use client";

import { Component as ParentComponent } from "@sps/knowledge/models/document/frontend/component";

export function Component() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Documents
      </h1>

      <ParentComponent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(props) => {
          return (
            <ParentComponent
              isServer={false}
              data={props.data}
              variant="admin-v2-form"
            />
          );
        }}
      />
    </div>
  );
}
