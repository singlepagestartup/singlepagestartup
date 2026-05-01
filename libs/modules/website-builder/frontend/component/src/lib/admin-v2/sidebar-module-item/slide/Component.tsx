import { Component as ParentComponent } from "@sps/website-builder/models/slide/frontend/component";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = isAdminRoute(props.url, "website-builder", "slide");

  return (
    <ParentComponent
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
