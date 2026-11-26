import type { ReactNode } from "react";

export const variant = "content-service-detail" as const;

export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
  backHref?: string;
  backTarget?: "_top";
  slots?: {
    heading: string;
    summary: string;
    description: string;
    price: ReactNode;
  };
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
