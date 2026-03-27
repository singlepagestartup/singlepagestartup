import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as Page } from "./page";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(ADMIN_BASE_PATH + "/telegram");
  const isOverviewRoute = props.url === ADMIN_BASE_PATH + "/telegram";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Page variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Page
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
