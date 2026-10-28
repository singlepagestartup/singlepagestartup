import { Component as ActionOutlineInverse } from "./action-outline-inverse";
import { Component as FooterLink } from "./footer-link";
import { Component as NavigationInverse } from "./navigation-inverse";
import { Component as Navigation } from "./navigation";
import { Component as Action } from "./action";
import { Component as ActionInverse } from "./action-inverse";
import { Component as Repository } from "./repository";
import { Component as RepositoryLink } from "./repository-link";
import { Component as TextAction } from "./text-action";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Link } from "./link";
import { Component as Ghost } from "./ghost";
import { Component as Outline } from "./outline";
import { Component as Destructive } from "./destructive";
import { Component as Secondary } from "./secondary";
import { Component as Primary } from "./primary";
import { Component as Default } from "./default";
import { Component as Children } from "./children";

export const variants = {
  "action-outline-inverse": ActionOutlineInverse,
  "footer-link": FooterLink,
  "navigation-inverse": NavigationInverse,
  navigation: Navigation,
  action: Action,
  "action-inverse": ActionInverse,
  repository: Repository,
  "repository-link": RepositoryLink,
  "text-action": TextAction,

  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  link: Link,
  ghost: Ghost,
  outline: Outline,
  destructive: Destructive,
  secondary: Secondary,
  primary: Primary,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
  children: Children,
};
