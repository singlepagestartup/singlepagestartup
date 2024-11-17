import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IIdentitiesDefaultComponentProps } from "./identities-default";
import { IComponentProps as IForgotPasswordComponentProps } from "./forgot-password";
import { IComponentProps as ILoginComponentProps } from "./login";
import { IComponentProps as ILogoutComponentProps } from "./logout";
import { IComponentProps as IRegistrationComponentProps } from "./registration";
import { IComponentProps as IResetPasswordComponentProps } from "./reset-password";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IIdentitiesDefaultComponentProps
  | IForgotPasswordComponentProps
  | ILoginComponentProps
  | ILogoutComponentProps
  | IRegistrationComponentProps
  | IResetPasswordComponentProps
  | never;
