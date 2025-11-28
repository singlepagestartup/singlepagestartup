import { Provider, api as clientApi } from "@sps/agent/models/agent/sdk/client";
import { api as serverApi } from "@sps/agent/models/agent/sdk/server";
import { insertSchema } from "@sps/agent/models/agent/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="agent"
      name="agent"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
