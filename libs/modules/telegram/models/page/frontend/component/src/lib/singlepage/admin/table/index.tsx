import {
  Provider,
  api as clientApi,
} from "@sps/telegram/models/page/sdk/client";
import { api as serverApi } from "@sps/telegram/models/page/sdk/server";
import { insertSchema } from "@sps/telegram/models/page/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="telegram"
      name="page"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
