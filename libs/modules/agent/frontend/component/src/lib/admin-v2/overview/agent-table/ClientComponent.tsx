"use client";

import { Component as Agent } from "@sps/agent/models/agent/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/agent/agent`);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Agent</h1>

      <Agent
        isServer={false}
        variant="admin-v2-table"
        adminForm={(data) => {
          return (
            <Agent isServer={false} data={data.data} variant="admin-v2-form" />
          );
        }}
      />
    </div>
  );
}
