import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as BrandAiChat } from "./brand/ai-chat/index";
import { Component as Default } from "./default/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "brand-ai-chat": BrandAiChat,
  default: Default,
  list: List,
};
