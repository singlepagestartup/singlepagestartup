"use client";
import { Component as ChangeEmail } from "../../../me-identity-change-email";
import type { IComponentPropsExtended } from "../interface";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
export function Component(
  props: IComponentPropsExtended & { identity: IIdentity },
) {
  return (
    <ChangeEmail
      isServer={false}
      variant="me-identity-change-email"
      data={props.data}
      identity={props.identity}
      className="contents"
    />
  );
}
