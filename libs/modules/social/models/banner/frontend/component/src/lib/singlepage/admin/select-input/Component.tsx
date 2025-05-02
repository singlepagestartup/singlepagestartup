import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="social"
      name="banner"
      label="banner"
      data={props.data}
      form={props.form}
      variant={props.variant}
      formFieldName={props.formFieldName}
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const variant = entity.variant ?? "Unknown Variant";
        const adminTitle = entity.adminTitle;

        return `${adminTitle} | ${variant}`;
      }}
    />
  );
}
