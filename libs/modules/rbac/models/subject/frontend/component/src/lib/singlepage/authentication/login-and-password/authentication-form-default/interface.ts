export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant =
  "authentication-login-and-password-authentication-form-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
