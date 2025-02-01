import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="crm"
      name="request"
      label="request"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
    />
  );
}
