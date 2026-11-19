import type {
  WorkflowDraft,
  WorkflowPerson,
  WorkflowRelease,
} from "../../../shared/workflows";

export const variant = "workflow-editor";

export interface IComponentProps {
  variant?: typeof variant;
  initialDraft: WorkflowDraft;
  currentRelease?: WorkflowRelease;
  people: WorkflowPerson[];
  payers: { id: string; title: string }[];
  onSave?: (draft: WorkflowDraft) => void;
  onPublish?: (draft: WorkflowDraft) => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
