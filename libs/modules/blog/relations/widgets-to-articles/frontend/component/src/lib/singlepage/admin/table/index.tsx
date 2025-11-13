import {
  Provider,
  api as clientApi,
} from "@sps/blog/relations/widgets-to-articles/sdk/client";
import { api as serverApi } from "@sps/blog/relations/widgets-to-articles/sdk/server";
import { insertSchema } from "@sps/blog/relations/widgets-to-articles/sdk/model";
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
