import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/roles-to-actions/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/roles-to-actions/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-form";
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
