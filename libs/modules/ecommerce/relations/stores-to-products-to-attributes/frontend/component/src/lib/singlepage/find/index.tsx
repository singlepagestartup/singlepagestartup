import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/client";
import { api as serverApi } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/find";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}