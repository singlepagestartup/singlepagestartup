import type { ReactNode } from "react";

export const variant = "content-feature-split" as const;

export interface IContentFeatureItem {
  id: string;
  title: string;
  description: string;
}

export interface IContentFeatureMedia {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  priority?: boolean;
}

export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  className?: string;
  eyebrow?: string;
  title: string;
  headingLevel?: "h1" | "h2" | "h3";
  description?: ReactNode;
  note?: ReactNode;
  media?: IContentFeatureMedia;
  mediaPosition?: "left" | "right";
  appearance?: "plain" | "muted";
  items?: IContentFeatureItem[];
  quote?: string;
  quoteLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
