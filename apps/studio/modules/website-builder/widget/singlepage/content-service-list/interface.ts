import type { ReactNode } from "react";

export const variant = "content-service-list" as const;

export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}

export interface IServiceCardProps {
  title: string;
  summary: string;
  href: string;
  target?: "_top";
  language: "en" | "ru";
  price: ReactNode;
}
