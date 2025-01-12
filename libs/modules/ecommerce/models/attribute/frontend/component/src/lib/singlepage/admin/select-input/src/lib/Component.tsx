import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="attribute"
      label="attribute"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField}
      renderFunction={(entity) => {
        return `String: ${entity.string} | Number: ${entity.number} | Boolean: ${entity.boolean} | ${entity.datetime}`;
      }}
    />
  );
}
