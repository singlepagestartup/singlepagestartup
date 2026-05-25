"use client";

import { Component as ParentComponent } from "@sps/knowledge/models/edit-suggestion/frontend/component";

export function Component() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Edit Suggestions
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
