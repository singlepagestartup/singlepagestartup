export const variant = "content-cta";

export type ContentCtaProps = {
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
};

type IVariantInputs = NonNullable<
  Partial<ContentCtaProps> & { variant?: "content-cta" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-cta";
}

export interface IComponentPropsExtended extends IComponentProps {}
