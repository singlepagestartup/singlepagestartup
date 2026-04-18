import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Form } from "./form";
import { Component as Input } from "./input";
import { Component as Option } from "./option";
import { Component as Request } from "./request";
import { Component as Step } from "./step";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "crm");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/crm";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Form variant="admin-v2-card" isServer={props.isServer} />
            <Input variant="admin-v2-card" isServer={props.isServer} />
            <Option variant="admin-v2-card" isServer={props.isServer} />
            <Request variant="admin-v2-card" isServer={props.isServer} />
            <Step variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Form
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Input
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Option
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Request
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Step
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
