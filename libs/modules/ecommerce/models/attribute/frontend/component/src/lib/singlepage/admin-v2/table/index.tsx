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
import { Component as AttributeKeysToAttributesComponent } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as ProductsToAttributesComponent } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

function renderAttributeKeysToAttributes(
  relationProps: ISpsComponentBase & { data?: IModel },
) {
  const attributeId = String(relationProps?.data?.id || "");

  if (!attributeId) {
    return null;
  }

  return (
    <AttributeKeysToAttributesComponent
      isServer={false}
      variant="admin-table"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "eq",
                value: attributeId,
              },
            ],
          },
        },
      }}
    />
  );
}

function renderProductsToAttributes(
  relationProps: ISpsComponentBase & { data?: IModel },
) {
  const attributeId = String(relationProps?.data?.id || "");

  if (!attributeId) {
    return null;
  }

  return (
    <ProductsToAttributesComponent
      isServer={false}
      variant="admin-v2-table"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "eq",
                value: attributeId,
              },
            ],
          },
        },
      }}
    />
  );
}

export function Component(props: IComponentProps) {
  const defaultAdminForm = (
    formProps: ISpsComponentBase & { data?: IModel },
  ) => {
    return (
      <AttributeAdminFormComponent
        isServer={formProps.isServer}
        variant="admin-v2-form"
        data={formProps.data}
        attributeKeysToAttributes={renderAttributeKeysToAttributes}
        productsToAttributes={renderProductsToAttributes}
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
