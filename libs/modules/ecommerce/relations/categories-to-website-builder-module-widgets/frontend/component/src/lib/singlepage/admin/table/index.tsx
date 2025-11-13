import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/client";
import { api as serverApi } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/server";
import { insertSchema } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/model";
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
