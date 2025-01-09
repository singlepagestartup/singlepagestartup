import { IComponentPropsExtended } from "./interface";
import { Component as AuthenticationLoginAndPasswordAuthenticationFormDefault } from "../login-and-password/authentication-form-default";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.className)}
    >
      <AuthenticationLoginAndPasswordAuthenticationFormDefault
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="authentication-login-and-password-authentication-form-default"
      />
    </div>
  );
}
