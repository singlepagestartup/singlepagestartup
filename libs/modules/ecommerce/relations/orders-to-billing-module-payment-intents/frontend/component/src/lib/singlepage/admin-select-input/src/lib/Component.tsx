import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-select-input2/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="orders-to-billing-module-payment-intents"
      label="orders-to-billing-module-payment-intents"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField}
    />
  );
}
