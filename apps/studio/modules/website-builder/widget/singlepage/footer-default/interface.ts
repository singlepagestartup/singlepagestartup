export const variant = "footer-default";

export interface IFooterLink {
  label: string;
  href: string;
  target?: "_self" | "_top";
}

export interface IFooterColumn {
  title: string;
  links: IFooterLink[];
}

export type FooterDefaultProps = {
  brand: string;
  description: string;
  copyright: string;
  columns: IFooterColumn[];
  legalLinks: IFooterLink[];
};

type IVariantInputs = NonNullable<
  Partial<FooterDefaultProps> & { variant?: "footer-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "footer-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
