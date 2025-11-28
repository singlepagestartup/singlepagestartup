import {
  Provider,
  api as clientApi,
} from "@sps/notification/relations/notifications-to-templates/sdk/client";
import { api as serverApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { insertSchema } from "@sps/notification/relations/notifications-to-templates/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="notification"
      name="notifications-to-templates"
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
