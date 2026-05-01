import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Action } from "./action";
import { Component as Identity } from "./identity";
import { Component as Permission } from "./permission";
import { Component as Role } from "./role";
import { Component as Subject } from "./subject";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "rbac");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/rbac";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Action variant="admin-v2-card" isServer={props.isServer} />
            <Identity variant="admin-v2-card" isServer={props.isServer} />
            <Permission variant="admin-v2-card" isServer={props.isServer} />
            <Role variant="admin-v2-card" isServer={props.isServer} />
            <Subject variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Action
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Identity
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Permission
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Role
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Subject
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
