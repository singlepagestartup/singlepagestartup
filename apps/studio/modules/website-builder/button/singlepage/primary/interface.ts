import type { SVGProps } from "react";

export const variant = "primary";

export interface ButtonPrimaryProps {
  variant?: "primary";
  label: string;
  href: string;
  icon?: ModuleIcon;
  target?: "_self" | "_top";
}

export type ModuleIcon = React.ComponentType<IModuleIconProps>;

type IVariantInputs = NonNullable<Partial<ButtonPrimaryProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "primary";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
