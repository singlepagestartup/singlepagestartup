import {
  Provider,
  api as clientApi,
} from "@sps/ecommerce/models/product/sdk/client";
import { api as serverApi } from "@sps/ecommerce/models/product/sdk/server";
import { insertSchema, IModel } from "@sps/ecommerce/models/product/sdk/model";
import { IComponentProps } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/table";
import { Component as ChildComponent } from "./Component";
import { Component as ProductAdminFormComponent } from "../form/Component";
import { Component as ProductsToAttributesComponent } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

function renderProductsToAttributes(
  relationProps: ISpsComponentBase & { data?: IModel },
) {
  const productId = String(relationProps?.data?.id || "");

  if (!productId) {
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
                column: "productId",
                method: "eq",
                value: productId,
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
      <ProductAdminFormComponent
        isServer={formProps.isServer}
        variant="admin-v2-form"
        data={formProps.data}
        productsToAttributes={renderProductsToAttributes}
      />
    );
  };

  return (
    <ParentComponent
      module="ecommerce"
      name="product"
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
