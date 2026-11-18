import { Provider } from "@sps/ecommerce/models/store/sdk/client";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/reader";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Provider={Provider}
      Component={props.isServer ? Server : Client}
      componentProps={props}
    />
  );
}
