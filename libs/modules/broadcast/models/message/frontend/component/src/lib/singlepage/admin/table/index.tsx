import {
  Provider,
  api as clientApi,
} from "@sps/broadcast/models/message/sdk/client";
import { api as serverApi } from "@sps/broadcast/models/message/sdk/server";
import { insertSchema } from "@sps/broadcast/models/message/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="broadcast"
      name="message"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
