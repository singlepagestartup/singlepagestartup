import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin-table-row";
import { Component as AdminTable } from "./admin-table";
import { Component as AdminSelectInput } from "./admin-select-input";
import { Component as AdminForm } from "./admin-form";
import { Component as Default } from "./default";
import { Component as Init } from "./init";
import { Component as LoginAndPassword } from "./login-and-password";
import { Component as LogoutAction } from "./logout-action";
import { Component as LogoutButton } from "./logout-button";
import { Component as IsAllowedWrapper } from "./is-authorized-wrapper";
import { Component as SelectMethod } from "./select-method";
import { Component as EthereumVirtualMachine } from "./ethereum-virtual-machine";
import { Component as Me } from "./me";
import { Component as GetEmails } from "./get-emails";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  init: Init,
  "login-and-password": LoginAndPassword,
  "logout-action": LogoutAction,
  "logout-button": LogoutButton,
  "is-authorized-wrapper": IsAllowedWrapper,
  "select-method": SelectMethod,
  "ethereum-virtual-machine": EthereumVirtualMachine,
  me: Me,
  "get-emails": GetEmails,
};
