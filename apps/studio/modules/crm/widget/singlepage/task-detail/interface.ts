import type {
  WorkflowPerson,
  Workflow,
  WorkflowTask,
} from "../../../shared/workflows";

export const variant = "task-detail";

export interface IComponentProps {
  variant?: typeof variant;
  task: WorkflowTask;
  workflow: Workflow;
  people: WorkflowPerson[];
  audience?: "manager" | "customer";
  canReadConversation?: boolean;
  onAssign?: (assigneeId: string) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
