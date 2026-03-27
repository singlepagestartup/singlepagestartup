import {
  Provider,
  api as clientApi,
} from "@sps/agent/models/widget/sdk/client";
import { api as serverApi } from "@sps/agent/models/widget/sdk/server";
import { route as apiRoute } from "@sps/agent/models/widget/sdk/model";
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
      module="agent"
      name="widget"
      {...props}
      apiRoute={apiRoute}
      href={props.href || ADMIN_BASE_PATH + "/agent/widget"}
    />
  );
}
