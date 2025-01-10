import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as IdentityUpdateDefault } from "./identity/update-default";
import { Component as IdentityCreateDefault } from "./identity/create-default";
import { Component as SubjectAuthenticationLoginAndPasswordForgotPasswordFormDefault } from "./subject/authentication/login-and-password/forgot-password-form-default";
import { Component as SubjectAuthenticationSelectMethodDefault } from "./subject/authentication/select-method-default";
import { Component as SubjectAuthenticationLogout } from "./subject/authentication/logout-action-default";
import { Component as SubjectAuthenticationLoginAndPasswordRegistrationFormDefault } from "./subject/authentication/login-and-password/registration-form-default";
import { Component as SubjectAuthenticationLoginAndPasswordResetPasswordFormDefault } from "./subject/authentication/login-and-password/reset-password-form-default";
import { Component as SubjectOverviewDefault } from "./subject/overview-default";
import { Component as SubjectListDefault } from "./subject/list-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "subject-authentication-login-and-password-forgot-password-form-default":
    SubjectAuthenticationLoginAndPasswordForgotPasswordFormDefault,
  "subject-authentication-select-method-default":
    SubjectAuthenticationSelectMethodDefault,
  logout: SubjectAuthenticationLogout,
  "subject-authentication-login-and-password-registration-form-default":
    SubjectAuthenticationLoginAndPasswordRegistrationFormDefault,
  "subject-authentication-login-and-password-reset-password-form-default":
    SubjectAuthenticationLoginAndPasswordResetPasswordFormDefault,
  default: Default,
  "subject-overview-default": SubjectOverviewDefault,
  "subject-list-default": SubjectListDefault,
  "identity-update-default": IdentityUpdateDefault,
  "identitity-create-default": IdentityCreateDefault,
};
