import { Component as ParentComponent } from "@sps/notification/models/topic/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(
    ADMIN_BASE_PATH + "/notification/topic",
  );

  return (
    <ParentComponent
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
