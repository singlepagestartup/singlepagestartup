import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/order/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/order/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import { Component as View } from "./Component";
import { Component as Client } from "./client";
import { Component as Server } from "./server";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={
        props.dataSource === "props" ? View : props.isServer ? Server : Client
      }
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}

export { type IModel } from "@sps/ecommerce/models/order/sdk/model";
