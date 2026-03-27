import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/server";
import { insertSchema } from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="rbac"
      name="permissions-to-billing-module-currencies"
      type="relation"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      adminForm={(props) => {
        return <AdminForm isServer={false} variant="admin-v2-form" />;
      }}
      {...props}
    />
  );
}
