import { Component as AdminV2Manager } from "./admin-v2-manager/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as Default } from "./default/index";
import { Component as Find } from "./find/index";

export const variants = {
  "admin-v2-manager": AdminV2Manager,
  "admin-v2-table": AdminV2Table,
  default: Default,
  find: Find,
};
