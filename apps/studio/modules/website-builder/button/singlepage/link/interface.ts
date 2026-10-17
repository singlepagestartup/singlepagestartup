export const variant = "link";

export interface ButtonLinkProps {
  variant?: "link";
  label: string;
  href: string;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
  target?: "_self" | "_top";
}

type IVariantInputs = NonNullable<Partial<ButtonLinkProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "link";
}

export interface IComponentPropsExtended extends IComponentProps {}
