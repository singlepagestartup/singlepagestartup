import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="products-to-attributes"
      label="products-to-attributes"
      renderField={props.renderField}
    />
  );
}
