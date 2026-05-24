import {
  Provider,
  api as clientApi,
} from "@sps/knowledge/models/chunk/sdk/client";
import { api as serverApi } from "@sps/knowledge/models/chunk/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="knowledge"
      name="chunk"
      baseSearchableFields={["id", "adminTitle", "variant", "slug"]}
      searchableFields={["contentHash", "text"]}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
