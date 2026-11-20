export const variant = "task-table";

import type { IComponentProps as TaskKanbanProps } from "../task-kanban/interface";

export interface IComponentProps extends Omit<TaskKanbanProps, "variant"> {
  variant?: typeof variant;
}

export interface IComponentPropsExtended extends IComponentProps {}
