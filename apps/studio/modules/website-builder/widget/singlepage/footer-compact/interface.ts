export const variant = "footer-compact";

export type FooterCompactProps = {
  brand: string;
  copyright: string;
  links: { label: string; href: string }[];
};

type IVariantInputs = NonNullable<
  Partial<FooterCompactProps> & { variant?: "footer-compact" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "footer-compact";
}

export interface IComponentPropsExtended extends IComponentProps {}
