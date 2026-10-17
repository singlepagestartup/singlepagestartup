import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/widgets-to-crm-module-widgets/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/widgets-to-crm-module-widgets/sdk/server";
import { insertSchema } from "@sps/rbac/relations/widgets-to-crm-module-widgets/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="rbac"
      name="widgets-to-crm-module-widgets"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
