import { internationalization } from "@sps/shared-configuration";
import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="social"
      name="thread"
      label="thread"
      data={props.data}
      form={props.form}
      variant={props.variant}
      formFieldName={props.formFieldName}
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const title = entity.title ?? "Untitled";
        const variant = entity.variant ?? "Unknown Variant";
        const adminTitle = entity.adminTitle;

        return `${title} | ${adminTitle} | ${variant}`;
      }}
    />
  );
}
