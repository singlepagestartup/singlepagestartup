import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/client";
import { api as serverApi } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-select-input";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
