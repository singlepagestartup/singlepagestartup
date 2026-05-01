import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Metric } from "./metric";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "analytic");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/analytic";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Metric variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Metric
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Widget
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
      </div>
    </main>
  );
}
