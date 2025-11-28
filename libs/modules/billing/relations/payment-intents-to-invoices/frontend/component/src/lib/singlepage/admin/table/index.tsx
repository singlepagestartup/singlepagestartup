import {
  Provider,
  api as clientApi,
} from "@sps/billing/relations/payment-intents-to-invoices/sdk/client";
import { api as serverApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { insertSchema } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="billing"
      name="payment-intents-to-invoices"
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
