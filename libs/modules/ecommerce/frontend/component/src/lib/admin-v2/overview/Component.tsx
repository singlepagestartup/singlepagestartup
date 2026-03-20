import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Component as Product } from "./product";
import { Component as Attribute } from "./attribute";
import { Component as AttributeKey } from "./attribute-key";
import { Component as Category } from "./category";
import { Component as Order } from "./order";
import { Component as Store } from "./store";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(`${ADMIN_BASE_PATH}/ecommerce`);
  const isOverviewRoute = props.url === `${ADMIN_BASE_PATH}/ecommerce`;

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Product variant="admin-v2-card" isServer={props.isServer} />
            <Attribute variant="admin-v2-card" isServer={props.isServer} />
            <AttributeKey variant="admin-v2-card" isServer={props.isServer} />
            <Category variant="admin-v2-card" isServer={props.isServer} />
            <Order variant="admin-v2-card" isServer={props.isServer} />
            <Store variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Product
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Attribute
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <AttributeKey
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Category
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Order
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Store
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
