import {
  Provider,
  api as clientApi,
} from "@sps/telegram/relations/widgets-to-external-widgets/sdk/client";
import { insertSchema } from "@sps/telegram/relations/widgets-to-external-widgets/sdk/model";
import { api as serverApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";
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
