import {
  Provider,
  api as clientApi,
} from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/client";
import { api as serverApi } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/form";
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
