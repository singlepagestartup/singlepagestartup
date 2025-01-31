import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin/select-input/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="website-builder"
      name="button"
      label="button"
      data={props.data}
      form={props.form}
      variant={props.variant}
      formFieldName={props.formFieldName}
      renderFunction={(entity) => {
        return `${
          props.renderField ||
          (`${entity.title?.[internationalization.defaultLanguage.code]}` as keyof IModel)
        } | ${entity.variant} | ${entity.url}`;
      }}
    />
  );
}
