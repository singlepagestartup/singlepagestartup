import {
  Provider,
  api as clientApi,
} from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/client";
import { api as serverApi } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server";
import { insertSchema } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="host"
      name="metadata-to-file-storage-module-files"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
