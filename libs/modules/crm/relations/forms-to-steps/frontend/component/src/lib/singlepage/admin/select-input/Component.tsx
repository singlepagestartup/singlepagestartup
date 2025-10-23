import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="crm"
      name="forms-to-steps"
      label="forms-to-steps"
      data={props.data}
      form={props.form}
      variant={props.variant}
      formFieldName={props.formFieldName}
      renderField={props.renderField || "id"}
    />
  );
}
