import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin-table-row";
import { Component as AdminTable } from "./admin-table";
import { Component as AdminSelectInput } from "./admin-select-input";
import { Component as AdminForm } from "./admin-form";
import { Component as Default } from "./default";
import { Component as IdentitiesUpdateDefault } from "./identities-update-default";
import { Component as IdentitiesCreateDefault } from "./identities-create-default";
import { Component as ForgotPassword } from "./forgot-password";
import { Component as Login } from "./login";
import { Component as Logout } from "./logout";
import { Component as Registration } from "./registration";
import { Component as ResetPassword } from "./reset-password";
import { Component as SubjectOverviewDefault } from "./subject-overview-default";
import { Component as SubjectsListDefault } from "./subjects-list-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "identities-update-default": IdentitiesUpdateDefault,
  "forgot-password": ForgotPassword,
  login: Login,
  logout: Logout,
  registration: Registration,
  "reset-password": ResetPassword,
  "subject-overview-default": SubjectOverviewDefault,
  "subjects-list-default": SubjectsListDefault,
  "identities-create-default": IdentitiesCreateDefault,
};
