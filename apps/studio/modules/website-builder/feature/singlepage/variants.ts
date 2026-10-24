import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as BadgeDefault } from "./badge-default/index";
import { Component as Card } from "./card/index";
import { Component as Dropdown } from "./dropdown/index";
import { Component as DefinitionCard } from "./definition-card";
import { Component as DefinitionItem } from "./definition-item";
import { Component as DefinitionChecklist } from "./definition-checklist";
import { Component as Step } from "./step";
import { Component as CopyRequest } from "./copy-request";
import { Component as ListItemDefault } from "./list-item-default/index";
import { Component as StatusDefault } from "./status-default/index";
import { Component as Testimotional } from "./testimotional/index";

export const variants = {
  "definition-card": DefinitionCard,
  "definition-item": DefinitionItem,
  "definition-checklist": DefinitionChecklist,
  step: Step,
  "copy-request": CopyRequest,
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "badge-default": BadgeDefault,
  card: Card,
  dropdown: Dropdown,
  "list-item-default": ListItemDefault,
  "status-default": StatusDefault,
  testimotional: Testimotional,
};
