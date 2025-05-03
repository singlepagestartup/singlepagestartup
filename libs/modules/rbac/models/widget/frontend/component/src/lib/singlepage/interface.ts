import { IComponentProps as ISubjectEcommerceProductListDefaultComponentProps } from "./subject/ecommerce/product/list/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ISubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps } from "./subject/authentication/email-and-password/forgot-password-form-default/interface";
import { IComponentProps as ISubjectAuthenticationSelectMethodDefaultComponentProps } from "./subject/authentication/select-method-default/interface";
import { IComponentProps as ISubjectAuthenticationLogoutActionDefaultComponentProps } from "./subject/authentication/logout-action-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps } from "./subject/authentication/email-and-password/registration-form-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps } from "./subject/authentication/email-and-password/reset-password-form-default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject/overview-default/interface";
import { IComponentProps as ISubjectsListDefaultComponentProps } from "./subject/list-default/interface";

export type IComponentProps =
  | ISubjectEcommerceProductListDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | ISubjectIdentitySettingsDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps
  | ISubjectAuthenticationSelectMethodDefaultComponentProps
  | ISubjectAuthenticationLogoutActionDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectsListDefaultComponentProps
  | never;
