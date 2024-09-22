import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/subjects-to-sessions/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/subjects-to-sessions/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-table2";
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
