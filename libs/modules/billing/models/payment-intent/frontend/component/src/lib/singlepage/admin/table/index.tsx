import {
  Provider,
  api as clientApi,
} from "@sps/billing/models/payment-intent/sdk/client";
import { api as serverApi } from "@sps/billing/models/payment-intent/sdk/server";
import { insertSchema } from "@sps/billing/models/payment-intent/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/table";
import { Component as ChildComponent } from "./Component";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      module="billing"
      name="payment-intent"
      searchableFields={Object.keys(insertSchema.shape)}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
