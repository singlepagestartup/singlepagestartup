export const variant = "navbar-default";

export interface INavbarButtonsProps {
  variant?: "navbar-default";
  activeHref?: string;
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}

type IVariantInputs = NonNullable<INavbarButtonsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "navbar-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
