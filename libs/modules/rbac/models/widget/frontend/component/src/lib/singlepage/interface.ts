import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IIdentityUpdateDefaultComponentProps } from "./identity/update-default/interface";
import { IComponentProps as IIdentityCreateDefaultComponentProps } from "./identity/create-default/interface";
import { IComponentProps as ISubjectAuthenticationLoginAndPasswordForgotPasswordComponentProps } from "./subject/authentication/login-and-password/forgot-password-form-default/interface";
import { IComponentProps as ISubjectAuthenticationSelectMethodDefaultComponentProps } from "./subject/authentication/select-method-default/interface";
import { IComponentProps as ISubjectAuthenticationLogoutActionDefaultComponentProps } from "./subject/authentication/logout-action-default/interface";
import { IComponentProps as ISubjectAuthenticationLoginAndPasswordRegistrationFormDefaultComponentProps } from "./subject/authentication/login-and-password/registration-form-default/interface";
import { IComponentProps as ISubjectAuthenticationLoginAndPasswordResetPasswordFormDefaultComponentProps } from "./subject/authentication/login-and-password/reset-password-form-default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject/overview-default/interface";
import { IComponentProps as ISubjectsListDefaultComponentProps } from "./subject/list-default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IIdentityUpdateDefaultComponentProps
  | ISubjectAuthenticationLoginAndPasswordForgotPasswordComponentProps
  | ISubjectAuthenticationSelectMethodDefaultComponentProps
  | ISubjectAuthenticationLogoutActionDefaultComponentProps
  | ISubjectAuthenticationLoginAndPasswordRegistrationFormDefaultComponentProps
  | ISubjectAuthenticationLoginAndPasswordResetPasswordFormDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectsListDefaultComponentProps
  | IIdentityCreateDefaultComponentProps
  | never;
