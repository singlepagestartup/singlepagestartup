import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as NavbarAiChat } from "./navbar/ai-chat/index";
import { Component as Default } from "./default/index";
import { Component as List } from "./list/index";
import { Component as NavbarDefault } from "./navbar-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "navbar-ai-chat": NavbarAiChat,
  default: Default,
  list: List,
  "navbar-default": NavbarDefault,
};
