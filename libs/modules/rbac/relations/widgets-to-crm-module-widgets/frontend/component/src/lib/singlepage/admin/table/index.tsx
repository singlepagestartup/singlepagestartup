import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/widgets-to-crm-module-widgets/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/widgets-to-crm-module-widgets/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      name="widgets-to-crm-module-widgets"
      module="rbac"
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
