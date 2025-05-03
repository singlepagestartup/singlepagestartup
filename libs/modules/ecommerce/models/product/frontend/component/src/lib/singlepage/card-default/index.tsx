import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/product/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/product/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/default";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  console.log("🚀 ~ Component ~ props:", props);

  return (
    <ParentComponent
      Component={ChildComponent as any}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
