import { IModel } from "@sps/sps-rbac/models/authentication/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "login-and-password" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  type: "authentication" | "registration";
}

export interface IComponentPropsExtended extends IComponentProps {}