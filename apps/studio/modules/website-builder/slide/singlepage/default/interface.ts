import type { ReactNode } from "react";
export const variant = "default";
export interface SlideProps {
  id: string;
  title: string;
  image: string;
  imageAlt: string;
  href?: string;
  description?: string;
  actions?: { id: string; label: string; href: string }[];
  children?: ReactNode;
}
export interface IComponentProps extends Partial<SlideProps> {
  variant?: "default";
}
export interface IComponentPropsExtended extends IComponentProps {}
