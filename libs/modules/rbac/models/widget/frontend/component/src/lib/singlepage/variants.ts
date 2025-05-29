import { Component as SubjectListSocialModuleProfileDefault } from "./subject/list/social-module/profile/default";
import { Component as SubjectOverviewSocialModuleProfileOverviewDefault } from "./subject/overview/social-module/profile/overview/default";
import { Component as SubjectOverviewEcommerceModuleProductListDefault } from "./subject/overview/ecommerce-module/product/list/default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as SubjectIdentitySettingsDefault } from "./subject/identity/settings-default";
import { Component as SubjectAuthenticationEmailAndPasswordForgotPasswordFormDefault } from "./subject/authentication/email-and-password/forgot-password-form-default";
import { Component as SubjectAuthenticationSelectMethodDefault } from "./subject/authentication/select-method-default";
import { Component as SubjectAuthenticationLogoutActionDefault } from "./subject/authentication/logout-action-default";
import { Component as SubjectAuthenticationEmailAndPasswordRegistrationFormDefault } from "./subject/authentication/email-and-password/registration-form-default";
import { Component as SubjectAuthenticationEmailAndPasswordResetPasswordFormDefault } from "./subject/authentication/email-and-password/reset-password-form-default";
import { Component as SubjectOverviewDefault } from "./subject/overview/default";
import { Component as SubjectListDefault } from "./subject/list/default";

export const variants = {
  "subject-list-social-module-profile-default":
    SubjectListSocialModuleProfileDefault,
  "subject-overview-social-module-profile-overview-default":
    SubjectOverviewSocialModuleProfileOverviewDefault,
  "subject-overview-ecommerce-module-product-list-default":
    SubjectOverviewEcommerceModuleProductListDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "subject-authentication-email-and-password-forgot-password-form-default":
    SubjectAuthenticationEmailAndPasswordForgotPasswordFormDefault,
  "subject-authentication-select-method-default":
    SubjectAuthenticationSelectMethodDefault,
  "subject-authentication-logout-action-default":
    SubjectAuthenticationLogoutActionDefault,
  "subject-authentication-email-and-password-registration-form-default":
    SubjectAuthenticationEmailAndPasswordRegistrationFormDefault,
  "subject-authentication-email-and-password-reset-password-form-default":
    SubjectAuthenticationEmailAndPasswordResetPasswordFormDefault,
  default: Default,
  "subject-overview-default": SubjectOverviewDefault,
  "subject-list-default": SubjectListDefault,
  "subject-identity-settings-default": SubjectIdentitySettingsDefault,
};
