import { IComponentPropsExtended } from "./interface";
import { Component as LoginAndPassword } from "../../../login-and-password";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.className)}
    >
      <LoginAndPassword
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="login-and-password"
      />
    </div>
  );
}
