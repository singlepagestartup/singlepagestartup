import { Provider, api as clientApi } from "@sps/rbac/models/act/sdk/client";
import { api as serverApi } from "@sps/rbac/models/act/sdk/server";
import { insertSchema } from "@sps/rbac/models/act/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="rbac"
      name="act"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
