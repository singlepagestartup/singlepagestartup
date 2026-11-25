import type { WorkflowFixture } from "../../../shared/workflows";

export const variant = "workflow-workspace";

export type WorkspaceScenario =
  "default" | "waiting" | "conflict" | "empty" | "error" | "forbidden";

export interface IComponentProps {
  variant?: typeof variant;
  fixture: WorkflowFixture;
  scenario?: WorkspaceScenario;
}

export interface IComponentPropsExtended extends IComponentProps {}
