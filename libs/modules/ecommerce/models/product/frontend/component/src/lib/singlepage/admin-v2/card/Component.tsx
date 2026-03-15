import { Component as SharedCardComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/card/Component";
import { IComponentPropsExtended } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <SharedCardComponent
      isServer={props.isServer}
      modelName="Product"
      apiRoute="/api/ecommerce/products"
      href={`${ADMIN_BASE_PATH}/ecommerce/product`}
    />
  );
}
