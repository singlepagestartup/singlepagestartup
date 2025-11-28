import {
  Provider,
  api as clientApi,
} from "@sps/telegram/relations/widgets-to-external-widgets/sdk/client";
import { insertSchema } from "@sps/telegram/relations/widgets-to-external-widgets/sdk/model";
import { api as serverApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="telegram"
      name="widgets-to-external-widgets"
      type="relation"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      adminForm={(props) => {
        return <AdminForm isServer={props.isServer} variant="admin-form" />;
      }}
      {...props}
    />
  );
}
