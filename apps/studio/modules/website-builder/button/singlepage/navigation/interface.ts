import type { HTMLAttributeAnchorTarget } from "react";

export const variant = "navigation";

export interface INavigationButtonProps {
  variant?: "navigation";
  label: string;
  href: string;
  target?: HTMLAttributeAnchorTarget;
  selected?: boolean;
  disabled?: boolean;
  onNavigate?: () => void;
}

type IVariantInputs = NonNullable<Partial<INavigationButtonProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navigation";
}

export interface IComponentPropsExtended extends IComponentProps {}
