import { Component as Category } from "@sps/blog/models/category/frontend/component";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";

export function Component(props: { url: string; isServer: boolean }) {
  const isActive = isAdminRoute(props.url, "blog", "category");

  return (
    <Category
      isServer={props.isServer}
      variant="admin-v2-sidebar-item"
      isActive={isActive}
    />
  );
}
