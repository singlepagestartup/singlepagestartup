import type { ReactNode } from "react";
export const variant = "content-ecommerce-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
