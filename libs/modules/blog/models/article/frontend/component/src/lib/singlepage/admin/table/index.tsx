import {
  Provider,
  api as clientApi,
} from "@sps/blog/models/article/sdk/client";
import { api as serverApi } from "@sps/blog/models/article/sdk/server";
import { insertSchema } from "@sps/blog/models/article/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="blog"
      name="article"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
