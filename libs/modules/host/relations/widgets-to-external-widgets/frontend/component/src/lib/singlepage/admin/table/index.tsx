import {
  Provider,
  api as clientApi,
} from "@sps/host/relations/widgets-to-external-widgets/sdk/client";
import { api as serverApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table";
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
