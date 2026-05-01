import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Article } from "./article";
import { Component as Category } from "./category";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "blog");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/blog";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Article variant="admin-v2-card" isServer={props.isServer} />
            <Category variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Article
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Category
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
