import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as HeaderAiChat } from "./header/ai-chat/index";
import { Component as Default } from "./default/index";
import { Component as List } from "./list/index";
import { Component as NavbarDefault } from "./navbar-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "header-ai-chat": HeaderAiChat,
  default: Default,
  list: List,
  "navbar-default": NavbarDefault,
};
