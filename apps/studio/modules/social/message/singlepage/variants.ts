import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as OverviewAiChat } from "./overview/ai-chat/index";
import { Component as BubbleDefault } from "./bubble-default/index";
import { Component as List } from "./list/index";
import { Component as ListAiChat } from "./list/ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "overview-ai-chat": OverviewAiChat,
  "bubble-default": BubbleDefault,
  list: List,
  "list-ai-chat": ListAiChat,
};
