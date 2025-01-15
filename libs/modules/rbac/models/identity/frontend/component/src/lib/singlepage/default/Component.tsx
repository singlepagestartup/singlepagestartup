import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="identity"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      {props.data.provider === "email_and_password" ? (
        <p className="text-3xl font-bold">{props.data.email}</p>
      ) : null}
    </div>
  );
}
