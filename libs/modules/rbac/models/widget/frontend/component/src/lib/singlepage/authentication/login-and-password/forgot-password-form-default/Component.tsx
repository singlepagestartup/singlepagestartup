import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Subject
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant="authentication-login-and-password-forgot-password-form-default"
      />
    </div>
  );
}
