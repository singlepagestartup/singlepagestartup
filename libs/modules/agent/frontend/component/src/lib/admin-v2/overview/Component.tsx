import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as AgentCard } from "./agent-card/Component";
import { Component as WidgetCard } from "./widget-card/Component";
import { Component as AgentTable } from "./agent-table/Component";
import { Component as WidgetTable } from "./widget-table/Component";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(`${ADMIN_BASE_PATH}/agent`);
  const isOverviewRoute = props.url === `${ADMIN_BASE_PATH}/agent`;

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AgentCard isServer={props.isServer} />
            <WidgetCard isServer={props.isServer} />
          </div>
        ) : null}

        <AgentTable isServer={props.isServer} url={props.url} />
        <WidgetTable isServer={props.isServer} url={props.url} />
      </div>
    </main>
  );
}
