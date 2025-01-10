export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant =
  "authentication-email-and-password-reset-password-form-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
