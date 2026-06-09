import {
  Provider,
  api as clientApi,
} from "@sps/knowledge/models/document/sdk/client";
import { api as serverApi } from "@sps/knowledge/models/document/sdk/server";
import { insertSchema } from "@sps/knowledge/models/document/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="knowledge"
      name="document"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
