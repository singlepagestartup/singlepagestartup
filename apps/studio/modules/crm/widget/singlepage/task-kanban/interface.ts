import type { TaskActions } from "../../../shared/workflow-ui";
import type {
  WorkflowPerson,
  WorkflowStage,
  WorkflowTask,
} from "../../../shared/workflows";

export const variant = "task-kanban";

export interface IComponentProps extends TaskActions {
  variant?: typeof variant;
  stages: WorkflowStage[];
  tasks: WorkflowTask[];
  people: WorkflowPerson[];
  pendingIds?: ReadonlySet<string>;
}

export interface IComponentPropsExtended extends IComponentProps {}
