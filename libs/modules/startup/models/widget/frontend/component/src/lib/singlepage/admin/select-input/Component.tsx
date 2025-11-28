import { internationalization } from "@sps/shared-configuration";
import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="startup"
      name="widget"
      label="widget"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const title =
          entity.title?.[internationalization.defaultLanguage.code] ??
          "Untitled";
        const variant = entity.variant ?? "Unknown Variant";
        const adminTitle = entity.adminTitle;

        return `${title} | ${adminTitle} | ${variant}`;
      }}
    />
  );
}
