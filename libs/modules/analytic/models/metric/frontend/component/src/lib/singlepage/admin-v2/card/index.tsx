import {
  Provider,
  api as clientApi,
} from "@sps/analytic/models/metric/sdk/client";
import { api as serverApi } from "@sps/analytic/models/metric/sdk/server";
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
      module="analytic"
      name="metric"
      {...props}
      apiRoute="/api/analytic/metrics"
      href={props.href || ADMIN_BASE_PATH + "/analytic/metric"}
    />
  );
}
