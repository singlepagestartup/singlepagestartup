import type { ReactNode } from "react";

export const variant = "content-faq";

export interface ContentFaqItem {
  q: string;
  a: string;
}

export type ContentFaqProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  contactHref: string;
  faq: { q: string; a: string }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentFaqProps> & { variant?: "content-faq" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-faq";
  appearance?: "default" | "plain";
  id?: string;
  aside?: ReactNode;
  actions?: ReactNode;
  questionsTitle?: string;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
