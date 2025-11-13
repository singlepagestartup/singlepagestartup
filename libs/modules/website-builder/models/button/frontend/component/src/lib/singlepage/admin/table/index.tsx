import {
  Provider,
  api as clientApi,
} from "@sps/website-builder/models/button/sdk/client";
import { api as serverApi } from "@sps/website-builder/models/button/sdk/server";
import { insertSchema } from "@sps/website-builder/models/button/sdk/model";
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
