import type { ReactNode } from "react";
export const variant = "step" as const;

export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  subtitle: string;
  description: string;
  children?: ReactNode;
  attachments?: { id: string; title: string }[];
  attachmentsLabel?: string;
  appearance?: "default" | "prominent";
}

export interface IComponentPropsExtended extends IComponentProps {}
