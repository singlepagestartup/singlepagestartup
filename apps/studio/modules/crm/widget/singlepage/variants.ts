import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as FormListDefault } from "./form-list-default/index";
import { Component as List } from "./list/index";

import { Component as TaskDetail } from "./task-detail/index";
import { Component as TaskKanban } from "./task-kanban/index";
import { Component as TaskTable } from "./task-table/index";
import { Component as WorkflowEditor } from "./workflow-editor/index";
import { Component as WorkflowWorkspace } from "./workflow-workspace/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "form-list-default": FormListDefault,
  list: List,
  "task-detail": TaskDetail,
  "task-kanban": TaskKanban,
  "task-table": TaskTable,
  "workflow-editor": WorkflowEditor,
  "workflow-workspace": WorkflowWorkspace,
};
