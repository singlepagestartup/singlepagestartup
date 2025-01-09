import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IIdentitiesUpdateDefaultComponentProps } from "./identities-update-default/interface";
import { IComponentProps as IIdentitiesCreateDefaultComponentProps } from "./identities-create-default/interface";
import { IComponentProps as IForgotPasswordComponentProps } from "./authentication/login-and-password/forgot-password-form-default/interface";
import { IComponentProps as ILoginComponentProps } from "./authentication/select-method-default/interface";
import { IComponentProps as ILogoutComponentProps } from "./authentication/logout-action-default/interface";
import { IComponentProps as IRegistrationComponentProps } from "./authentication/login-and-password/registration-form-default/interface";
import { IComponentProps as IResetPasswordComponentProps } from "./authentication/login-and-password/reset-password-form-default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject-overview-default/interface";
import { IComponentProps as ISubjectsListDefaultComponentProps } from "./subjects-list-default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IIdentitiesUpdateDefaultComponentProps
  | IForgotPasswordComponentProps
  | ILoginComponentProps
  | ILogoutComponentProps
  | IRegistrationComponentProps
  | IResetPasswordComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectsListDefaultComponentProps
  | IIdentitiesCreateDefaultComponentProps
  | never;
