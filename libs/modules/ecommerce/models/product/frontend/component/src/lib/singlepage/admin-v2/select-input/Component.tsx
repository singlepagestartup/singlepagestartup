import { IComponentPropsExtended, variant, IModel } from "./interface";
import { Component as ParentComponent } from "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  return (
    <ParentComponent<IModel, typeof variant>
      {...props}
      module="ecommerce"
      name="product"
      label="product"
      renderField={props.renderField || "adminTitle"}
      renderFunction={(entity) => {
        const title =
          entity.title?.[internationalization.defaultLanguage.code] ??
          "Untitled";
        const productVariant = entity.variant ?? "Unknown Variant";
        const adminTitle = entity.adminTitle;

        return `${title} | ${adminTitle} | ${productVariant}`;
      }}
    />
  );
}
