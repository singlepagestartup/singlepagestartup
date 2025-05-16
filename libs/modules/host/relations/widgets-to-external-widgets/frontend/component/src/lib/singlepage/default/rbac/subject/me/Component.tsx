import { Component as Ecommerce } from "./ecommerce-module/Component";
import { Component as CrmModuleFormRequestCreate } from "./crm-module-form-request-create/Component";
import { IComponentProps } from "./interface";
import { Component as AuthenticationDefault } from "./authentication/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "me-authentication-default") {
    return <AuthenticationDefault {...(props as any)} />;
  }

  if (props.variant.startsWith("me-ecommerce-module")) {
    return <Ecommerce {...(props as any)} />;
  }

  if (props.variant === "me-crm-module-form-request-create") {
    return <CrmModuleFormRequestCreate {...(props as any)} />;
  }

  return <></>;
}
