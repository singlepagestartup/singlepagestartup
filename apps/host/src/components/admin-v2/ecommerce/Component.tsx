"use client";
import { isAdminRoute } from "@sps/shared-frontend-client-utils";
import { AdminV2Overview as EcommerceModuleAdminV2Overview } from "@sps/ecommerce/frontend/component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (!isAdminRoute(props.url, "ecommerce")) {
    return null;
  }
  return <EcommerceModuleAdminV2Overview isServer={false} url={props.url} />;
}
