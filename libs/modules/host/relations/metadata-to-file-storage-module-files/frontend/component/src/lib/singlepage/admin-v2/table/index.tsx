import {
  Provider,
  api as clientApi,
} from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/client";
import { api as serverApi } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server";
import { insertSchema } from "@sps/host/relations/metadata-to-file-storage-module-files/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="host"
      name="metadata-to-file-storage-module-files"
      type="relation"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      adminForm={() => <AdminForm isServer={false} variant="admin-v2-form" />}
      {...props}
    />
  );
}
