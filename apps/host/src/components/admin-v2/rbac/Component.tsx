"use client";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";
import { AdminV2Overview } from "@sps/rbac/frontend/component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  if (!isAdminRoute(props.url, "rbac")) {
    return null;
  }
  return <AdminV2Overview isServer={false} url={props.url} />;
}
