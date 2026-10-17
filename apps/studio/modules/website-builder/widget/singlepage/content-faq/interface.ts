export const variant = "content-faq";

export interface ContentFaqItem {
  q: string;
  a: string;
}

export type ContentFaqProps = {
  eyebrow: string;
  title: string;
  description: string;
  contactHref: string;
  faq: { q: string; a: string }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentFaqProps> & { variant?: "content-faq" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-faq";
}

export interface IComponentPropsExtended extends IComponentProps {}
