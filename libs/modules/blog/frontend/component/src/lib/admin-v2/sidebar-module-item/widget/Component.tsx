import { Component as Widget } from "@sps/blog/models/widget/frontend/component";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = isAdminRoute(props.url, "blog", "widget");

  return (
    <Widget
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
