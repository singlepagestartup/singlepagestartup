import {
  Provider,
  api as clientApi,
} from "@sps/social/models/thread/sdk/client";
import { api as serverApi } from "@sps/social/models/thread/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/sidebar-item";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      module="social"
      name="thread"
      {...props}
    />
  );
}
