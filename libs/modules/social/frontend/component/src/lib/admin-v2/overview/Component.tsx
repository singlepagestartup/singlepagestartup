import { IComponentProps } from "./interface";
import {
  getAdminRoutePath,
  isAdminRoute,
} from "@sps/shared-frontend-client-utils";
import { Component as Action } from "./action";
import { Component as Attribute } from "./attribute";
import { Component as AttributeKey } from "./attribute-key";
import { Component as Chat } from "./chat";
import { Component as Message } from "./message";
import { Component as Profile } from "./profile";
import { Component as Thread } from "./thread";
import { Component as Widget } from "./widget";

export function Component(props: IComponentProps) {
  const isCurrentModule = isAdminRoute(props.url, "social");
  const isOverviewRoute = getAdminRoutePath(props.url) === "/social";

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Action variant="admin-v2-card" isServer={props.isServer} />
            <Attribute variant="admin-v2-card" isServer={props.isServer} />
            <AttributeKey variant="admin-v2-card" isServer={props.isServer} />
            <Chat variant="admin-v2-card" isServer={props.isServer} />
            <Message variant="admin-v2-card" isServer={props.isServer} />
            <Profile variant="admin-v2-card" isServer={props.isServer} />
            <Thread variant="admin-v2-card" isServer={props.isServer} />
            <Widget variant="admin-v2-card" isServer={props.isServer} />
          </div>
        ) : null}

        <Action
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
        <Chat
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Message
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Profile
          variant="admin-v2-table"
          isServer={props.isServer}
          url={props.url}
        />
        <Thread
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
