import { Provider } from "@sps/social/models/profile/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import type { IProductDetailProps } from "../interface";
import Client from "./client";
import Server from "./server";
export function Component(props: IProductDetailProps) {
  return (
    <ParentComponent
      Component={props.isServer ? Server : Client}
      Provider={Provider}
      componentProps={{
        isServer: props.isServer,
        ecommerceModuleProductId: props.ecommerceModuleProduct.id,
        language: props.language,
      }}
    />
  );
}
