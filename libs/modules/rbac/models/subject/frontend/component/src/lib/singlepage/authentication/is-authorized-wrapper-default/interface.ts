import type { IProps as IClientProps } from "@sps/rbac/models/subject/sdk/client";
export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ReactNode } from "react";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "authentication-is-authorized-wrapper-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  children: ReactNode;
  apiProps: IClientProps["IAuthenticationIsAuthorizedProps"];
  className?: string;
  fallback?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
