import type { ReactNode } from "react";

export const variant = "content-steps" as const;

export interface IContentStep {
  id: string;
  title: string;
  description: string;
}

export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  appearance?: "contained" | "full";
  eyebrow?: string;
  title: string;
  steps?: IContentStep[];
  prompt?: ReactNode;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
