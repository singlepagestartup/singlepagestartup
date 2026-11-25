import type { Workflow, WorkflowPerson } from "../../../shared/workflows";

export const variant = "workflow-editor";

export interface IComponentProps {
  variant?: typeof variant;
  initialWorkflow: Workflow;
  people: WorkflowPerson[];
  payers: { id: string; title: string }[];
  language?: string;
  onSave?: (draft: Workflow) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
