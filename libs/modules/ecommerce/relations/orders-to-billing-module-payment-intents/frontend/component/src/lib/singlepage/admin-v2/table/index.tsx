import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/client";
import { api as serverApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { insertSchema } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as AdminForm } from "../form";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="ecommerce"
      name="orders-to-billing-module-payment-intents"
      type="relation"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      adminForm={(adminFormProps) => {
        return (
          <AdminForm
            isServer={adminFormProps.isServer}
            variant="admin-v2-form"
            apiProps={props.apiProps}
            relatedContext={props.relatedContext}
          />
        );
      }}
      {...props}
    />
  );
}
