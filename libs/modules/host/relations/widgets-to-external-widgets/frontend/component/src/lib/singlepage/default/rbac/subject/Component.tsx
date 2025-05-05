import { Component as EcommerceProductAction } from "./ecommerce-product-action/Component";
import { Component as SocialModuleProfileButtonDefault } from "./social-module-profile-button-default/Component";
import { Component as CrmModuleFormRequestCreate } from "./crm-module-form-request-create/Component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  if (props.variant === "ecommerce-product-action") {
    return (
      <EcommerceProductAction
        isServer={props.isServer}
        language={props.language}
        billingModuleCurrencyId={props.billingModuleCurrencyId}
        product={props.product}
        store={props.store}
        variant={props.variant}
      />
    );
  }

  if (props.variant === "social-module-profile-button-default") {
    return (
      <SocialModuleProfileButtonDefault
        isServer={props.isServer}
        language={props.language}
        data={props.data}
        variant={props.variant}
      />
    );
  }

  if (props.variant === "crm-module-form-request-create") {
    return (
      <CrmModuleFormRequestCreate
        isServer={props.isServer}
        language={props.language}
        form={props.form}
        variant={props.variant}
      />
    );
  }

  return <></>;
}
