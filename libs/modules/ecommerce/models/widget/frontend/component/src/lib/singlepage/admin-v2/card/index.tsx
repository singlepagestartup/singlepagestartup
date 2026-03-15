import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/widget/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/widget/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/card";
import { Component as ChildComponent } from "./Component";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      module="ecommerce"
      name="widget"
      {...props}
      apiRoute="/api/ecommerce/widgets"
      href={props.href || ADMIN_BASE_PATH + "/ecommerce/widget"}
    />
  );
}
