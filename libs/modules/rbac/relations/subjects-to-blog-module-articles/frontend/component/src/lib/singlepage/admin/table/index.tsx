import {
  Provider,
  api as clientApi,
} from "@sps/rbac/relations/subjects-to-blog-module-articles/sdk/client";
import { api as serverApi } from "@sps/rbac/relations/subjects-to-blog-module-articles/sdk/server";
import { insertSchema } from "@sps/rbac/relations/subjects-to-blog-module-articles/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
