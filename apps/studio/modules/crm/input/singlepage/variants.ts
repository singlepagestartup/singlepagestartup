import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as List } from "./list/index";
import { Component as SelectOptionDefault } from "./select-option-default/index";
import { Component as TextDefault } from "./text-default/index";
import { Component as TextareaDefault } from "./textarea-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  list: List,
  "select-option-default": SelectOptionDefault,
  "text-default": TextDefault,
  "textarea-default": TextareaDefault,
};
