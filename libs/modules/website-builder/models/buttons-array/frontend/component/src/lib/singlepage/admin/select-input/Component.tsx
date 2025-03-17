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
      renderField={
        `title.[${internationalization.defaultLanguage.code}]` as keyof IModel
      }
      renderFunction={(entity) => {
        const title =
          entity.title?.[internationalization.defaultLanguage.code] ??
          "Untitled";
        const variant = entity.variant ?? "Unknown Variant";

        return `${title} | ${variant} | ${entity.slug}`;
      }}
    />
  );
}
