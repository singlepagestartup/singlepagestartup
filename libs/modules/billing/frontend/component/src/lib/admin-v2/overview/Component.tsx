import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as PaymentIntent } from "./payment-intent";
import { Component as Invoice } from "./invoice";
import { Component as Currency } from "./currency";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "billing");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/billing";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PaymentIntent variant="admin-v2-card" isServer={props.isServer} />
            <Invoice variant="admin-v2-card" isServer={props.isServer} />
            <Currency variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <PaymentIntent
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Invoice
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Currency
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
