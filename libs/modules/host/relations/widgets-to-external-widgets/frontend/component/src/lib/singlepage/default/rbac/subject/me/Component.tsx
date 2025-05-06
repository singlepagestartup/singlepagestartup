import { Component as EcommerceProductAction } from "./ecommerce-product-action/Component";
import { Component as CrmModuleFormRequestCreate } from "./crm-module-form-request-create/Component";
import { IComponentProps } from "./interface";
import { Component as AuthenticationDefault } from "./authentication/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-authentication-default") {
    return (
      <AuthenticationDefault
        isServer={props.isServer}
        language={props.language}
        variant={props.variant}
      />
    );
  }

  if (props.variant === "me-ecommerce-product-action") {
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

  if (props.variant === "me-crm-module-form-request-create") {
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
