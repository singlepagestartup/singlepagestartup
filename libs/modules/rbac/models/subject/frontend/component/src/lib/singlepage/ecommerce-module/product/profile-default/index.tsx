import { Provider } from "@sps/social/models/profile/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import type { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
export function Component(props: IComponentProps) {
  if (!props.ecommerceModuleProductId) return null;
  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={props}
    />
  );
}
