import type { ReactNode } from "react";

export const variant = "content-offer" as const;

export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  note?: ReactNode;
  appearance?: "light" | "dark";
  headingLevel?: "h2" | "h3";
  embedded?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
