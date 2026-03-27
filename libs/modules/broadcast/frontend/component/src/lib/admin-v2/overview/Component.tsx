import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as Channel } from "./channel";
import { Component as Message } from "./message";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(ADMIN_BASE_PATH + "/broadcast");
  const isOverviewRoute = props.url === ADMIN_BASE_PATH + "/broadcast";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Channel variant="admin-v2-card" isServer={props.isServer} />
            <Message variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Channel
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Message
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
      </div>
    </main>
  );
}
