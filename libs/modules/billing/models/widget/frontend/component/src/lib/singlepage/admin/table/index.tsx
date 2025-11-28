import {
  Provider,
  api as clientApi,
} from "@sps/billing/models/widget/sdk/client";
import { api as serverApi } from "@sps/billing/models/widget/sdk/server";
import { insertSchema } from "@sps/billing/models/widget/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="billing"
      name="widget"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
