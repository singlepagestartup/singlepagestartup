import { IComponentPropsExtended } from "./interface";
import { Component as AuthenticationEmailAndPasswordAuthenticationFormDefault } from "../email-and-password/authentication-form-default";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.className)}
    >
      <AuthenticationEmailAndPasswordAuthenticationFormDefault
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="authentication-email-and-password-authentication-form-default"
      />
    </div>
  );
}
