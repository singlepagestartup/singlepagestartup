import { Component as ParentComponent } from "@sps/rbac/models/action/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(ADMIN_BASE_PATH + "/rbac/action");

  return (
    <ParentComponent
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
