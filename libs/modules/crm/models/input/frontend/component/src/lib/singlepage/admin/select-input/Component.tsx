import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="crm"
      name="input"
      label="input"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={
        props.renderField ||
        (`title.[${internationalization.defaultLanguage.code}]` as keyof IModel)
      }
    />
  );
}
