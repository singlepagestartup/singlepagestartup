import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/attribute/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/attribute/sdk/server";
import {
  insertSchema,
  IModel,
} from "@sps/ecommerce/models/attribute/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as AttributeAdminFormComponent } from "../form/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: IComponentProps) {
  const defaultAdminForm = (
    formProps: ISpsComponentBase & { data?: IModel },
  ) => {
    return (
      <AttributeAdminFormComponent
        isServer={formProps.isServer}
        variant="admin-v2-form"
        data={formProps.data}
      />
    );
  };

  return (
    <ParentComponent
      module="ecommerce"
      name="attribute"
      searchableFields={Object.keys(insertSchema.shape)}
      adminForm={props.adminForm ?? defaultAdminForm}
      Component={ChildComponent}
      Provider={Provider}
      clientApi={clientApi}
      serverApi={serverApi}
      {...props}
    />
  );
}
