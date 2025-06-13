import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="website-builder"
      name="buttons-array"
      label="buttons-array"
      formFieldName={props.formFieldName}
      data={props.data}
      form={props.form}
      variant={props.variant}
      renderField="adminTitle"
      renderFunction={(entity) => {
        const variant = entity.variant ?? "Unknown Variant";

        return `${entity.adminTitle} | ${entity.title?.[internationalization.defaultLanguage.code] ?? "Untitled"} | ${variant} | ${entity.slug}`;
      }}
    />
  );
}
