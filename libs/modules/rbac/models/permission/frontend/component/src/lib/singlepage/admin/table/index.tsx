import {
  Provider,
  api as clientApi,
} from "@sps/rbac/models/permission/sdk/client";
import { api as serverApi } from "@sps/rbac/models/permission/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";
import { insertSchema } from "@sps/rbac/models/permission/sdk/model";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="rbac"
      name="permission"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
