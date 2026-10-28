import type { ReactNode } from "react";
export const variant = "content-project-context" as const;
export interface IProjectDocument {
  id: string;
  title: string;
  description: string;
  example: string;
}
export interface IComponentProps {
  variant?: typeof variant;
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  projectTitle: string;
  savedTitle: string;
  documents: IProjectDocument[];
  documentExampleLabel: string;
  taskTitle: string;
  taskContext: string;
  task: string;
  taskNote: string;
  publishTitle: string;
  publishDescription: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
