import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="rbac"
      name="identity"
      label="identity"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField || "provider"}
      renderFunction={(entity) => {
        return `Provider: ${entity.provider} | Account: ${entity.account} | Email: ${entity.email}`;
      }}
    />
  );
}
