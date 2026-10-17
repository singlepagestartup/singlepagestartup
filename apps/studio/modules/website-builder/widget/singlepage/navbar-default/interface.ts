import type { ReactNode } from "react";

export const variant = "navbar-default";

export interface NavbarDefaultProps {
  variant?: "navbar-default";
  activeHref?: string;
  brand?: string;
  cartButton?: ReactNode;
  subjectAccount?: ReactNode;
}

type IVariantInputs = NonNullable<NavbarDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navbar-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
