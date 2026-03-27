import { Component as ParentComponent } from "@sps/file-storage/models/widget/frontend/component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = props.url.startsWith(
    ADMIN_BASE_PATH + "/file-storage/widget",
  );

  return (
    <ParentComponent
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
