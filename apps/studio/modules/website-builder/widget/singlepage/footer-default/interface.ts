export const variant = "footer-default";

export type FooterDefaultProps = {
  brand: string;
  description: string;
  copyright: string;
  columns: { title: string; links: string[] }[];
  legalLinks: string[];
};

type IVariantInputs = NonNullable<
  Partial<FooterDefaultProps> & { variant?: "footer-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "footer-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
