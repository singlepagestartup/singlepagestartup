import { Component as SharedModelHeaderComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/model-header/Component";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const moduleHref = `${props.adminBasePath}/modules/ecommerce`;

  return (
    <SharedModelHeaderComponent
      isServer={props.isServer}
      moduleName="Ecommerce"
      moduleHref={moduleHref}
      modelName="Product"
      modelHref={`${moduleHref}/models/product`}
    />
  );
}
