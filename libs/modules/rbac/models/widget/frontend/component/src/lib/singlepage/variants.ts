import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as IdentitiesUpdateDefault } from "./identities-update-default";
import { Component as IdentitiesCreateDefault } from "./identities-create-default";
import { Component as AuthenticationLoginAndPasswordForgotPasswordFormDefault } from "./authentication/login-and-password/forgot-password-form-default";
import { Component as AuthenticationSelectMethodDefault } from "./authentication/select-method-default";
import { Component as Logout } from "./authentication/logout-action-default";
import { Component as AuthenticationLoginAndPasswordRegistrationFormDefault } from "./authentication/login-and-password/registration-form-default";
import { Component as AuthenticationLoginAndPasswordResetPasswordFormDefault } from "./authentication/login-and-password/reset-password-form-default";
import { Component as SubjectOverviewDefault } from "./subject-overview-default";
import { Component as SubjectsListDefault } from "./subjects-list-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "authentication-login-and-password-forgot-password-form-default":
    AuthenticationLoginAndPasswordForgotPasswordFormDefault,
  "authentication-select-method-default": AuthenticationSelectMethodDefault,
  logout: Logout,
  "authentication-login-and-password-registration-form-default":
    AuthenticationLoginAndPasswordRegistrationFormDefault,
  "authentication-login-and-password-reset-password-form-default":
    AuthenticationLoginAndPasswordResetPasswordFormDefault,
  default: Default,
  "identities-update-default": IdentitiesUpdateDefault,
  "subject-overview-default": SubjectOverviewDefault,
  "subjects-list-default": SubjectsListDefault,
  "identities-create-default": IdentitiesCreateDefault,
};
