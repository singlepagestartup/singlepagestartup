import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Form } from "./admin-v2-form/index";
import { Component as AdminV2List } from "./admin-v2-list/index";
import { Component as AdminV2SelectInput } from "./admin-v2-select-input/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChat } from "./ai-chat/index";
import { Component as AiChatHeader } from "./ai-chat-header/index";
import { Component as Default } from "./default/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-form": AdminV2Form,
  "admin-v2-list": AdminV2List,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-table": AdminV2Table,
  "ai-chat": AiChat,
  "ai-chat-header": AiChatHeader,
  default: Default,
  list: List,
};
