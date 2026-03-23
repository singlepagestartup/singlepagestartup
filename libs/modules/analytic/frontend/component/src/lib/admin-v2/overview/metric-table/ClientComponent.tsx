"use client";

import { Component as Metric } from "@sps/analytic/models/metric/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/analytic/metric`);

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Metric</h1>

      <Metric
        isServer={false}
        variant="admin-v2-table"
        adminForm={(data) => {
          if (data.data) {
            return (
              <Metric
                isServer={false}
                data={data.data as any}
                variant={"admin-v2-form" as any}
              />
            );
          }

          return <Metric isServer={false} variant={"admin-v2-form" as any} />;
        }}
      />
    </div>
  );
}
