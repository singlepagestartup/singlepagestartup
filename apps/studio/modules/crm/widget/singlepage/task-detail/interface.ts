import type {
  WorkflowPerson,
  WorkflowRelease,
  WorkflowTask,
} from "../../../shared/workflows";

export const variant = "task-detail";

export interface IComponentProps {
  variant?: typeof variant;
  task: WorkflowTask;
  release: WorkflowRelease;
  people: WorkflowPerson[];
  audience?: "manager" | "customer";
  canReadCosts?: boolean;
}

export interface IComponentPropsExtended extends IComponentProps {}
