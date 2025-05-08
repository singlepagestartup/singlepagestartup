import { Component as EcommerceProductAction } from "./ecommerce-product-action/Component";
import { Component as CrmModuleFormRequestCreate } from "./crm-module-form-request-create/Component";
import { IComponentProps } from "./interface";
import { Component as AuthenticationDefault } from "./authentication/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-authentication-default") {
    return <AuthenticationDefault {...props} />;
  }

  if (props.variant === "me-ecommerce-product-action") {
    return <EcommerceProductAction {...props} />;
  }

  if (props.variant === "me-crm-module-form-request-create") {
    return <CrmModuleFormRequestCreate {...props} />;
  }

  return <></>;
}
