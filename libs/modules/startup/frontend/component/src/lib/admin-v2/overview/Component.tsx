import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "startup");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/startup";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Widget
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
      </div>
    </main>
  );
}
