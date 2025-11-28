import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/attribute-key/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { insertSchema } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="ecommerce"
      name="attribute-key"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
