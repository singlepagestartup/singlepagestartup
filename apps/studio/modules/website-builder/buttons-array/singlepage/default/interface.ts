import type { SVGProps } from "react";

export const variant = "default";

export interface ButtonsArrayItem {
  label: string;
  href: string;
  variant: "link" | "primary" | "secondary";
  icon?: ModuleIcon;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
  inverse?: boolean;
  target?: "_self" | "_top";
}

export interface ButtonsArrayDefaultProps {
  variant?: "default";
  ariaLabel?: string;
  buttons: ButtonsArrayItem[];
  orientation?: "horizontal" | "vertical";
  title?: string;
}

export type ModuleIcon = React.ComponentType<IModuleIconProps>;

type IVariantInputs = NonNullable<Partial<ButtonsArrayDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
