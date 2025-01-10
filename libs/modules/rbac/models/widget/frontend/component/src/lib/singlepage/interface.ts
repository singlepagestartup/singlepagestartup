import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IIdentityUpdateDefaultComponentProps } from "./identity/update-default/interface";
import { IComponentProps as IIdentityCreateDefaultComponentProps } from "./identity/create-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps } from "./subject/authentication/email-and-password/forgot-password-form-default/interface";
import { IComponentProps as ISubjectAuthenticationSelectMethodDefaultComponentProps } from "./subject/authentication/select-method-default/interface";
import { IComponentProps as ISubjectAuthenticationLogoutActionDefaultComponentProps } from "./subject/authentication/logout-action-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps } from "./subject/authentication/email-and-password/registration-form-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps } from "./subject/authentication/email-and-password/reset-password-form-default/interface";
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
  | ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps
  | ISubjectAuthenticationSelectMethodDefaultComponentProps
  | ISubjectAuthenticationLogoutActionDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectsListDefaultComponentProps
  | IIdentityCreateDefaultComponentProps
  | never;
