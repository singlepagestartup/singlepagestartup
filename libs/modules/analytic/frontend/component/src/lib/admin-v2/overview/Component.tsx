import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as MetricCard } from "./metric-card/Component";
import { Component as WidgetCard } from "./widget-card/Component";
import { Component as MetricTable } from "./metric-table/Component";
import { Component as WidgetTable } from "./widget-table/Component";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(`${ADMIN_BASE_PATH}/analytic`);
  const isOverviewRoute = props.url === `${ADMIN_BASE_PATH}/analytic`;

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard isServer={props.isServer} />
            <WidgetCard isServer={props.isServer} />
          </div>
        ) : null}

        <MetricTable isServer={props.isServer} url={props.url} />
        <WidgetTable isServer={props.isServer} url={props.url} />
      </div>
    </main>
  );
}
