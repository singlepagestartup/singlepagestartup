import { Component as SharedCardComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/card/Component";
import { IComponentPropsExtended } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <SharedCardComponent
      isServer={props.isServer}
      modelName="Attribute"
      apiRoute="/api/ecommerce/attributes"
      href={`${ADMIN_BASE_PATH}/ecommerce/attribute`}
    />
  );
}
