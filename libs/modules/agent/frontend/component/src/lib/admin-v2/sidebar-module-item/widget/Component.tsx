import { Component as Widget } from "@sps/agent/models/widget/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(`${ADMIN_BASE_PATH}/agent/widget`);

  return (
    <Widget
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
