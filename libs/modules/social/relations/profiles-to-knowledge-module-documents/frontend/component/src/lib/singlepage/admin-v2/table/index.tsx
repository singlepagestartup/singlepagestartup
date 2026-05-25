import {
  Provider,
  api as clientApi,
} from "@sps/social/relations/profiles-to-knowledge-module-documents/sdk/client";
import { api as serverApi } from "@sps/social/relations/profiles-to-knowledge-module-documents/sdk/server";
import { insertSchema } from "@sps/social/relations/profiles-to-knowledge-module-documents/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="social"
      name="profiles-to-knowledge-module-documents"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
