import type { ReactNode } from "react";

export const variant = "website";

export interface IWebsiteLayoutProps {
  variant?: "website";
  children?: ReactNode;
  activeHref?: string;
  footer?: "default" | "compact";
  signedIn?: boolean;
  subjectAccount?: ReactNode;
  cartButton?: ReactNode;
  cartDrawer?: ReactNode;
  cartCount?: number;
}

type IVariantInputs = NonNullable<IWebsiteLayoutProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "website";
}

export interface IComponentPropsExtended extends IComponentProps {}
