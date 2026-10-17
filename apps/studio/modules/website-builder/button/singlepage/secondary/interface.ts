import type { SVGProps } from "react";

export const variant = "secondary";

export interface ButtonSecondaryProps {
  variant?: "secondary";
  label: string;
  href: string;
  icon?: ModuleIcon;
  inverse?: boolean;
  target?: "_self" | "_top";
}

export type ModuleIcon = React.ComponentType<IModuleIconProps>;

type IVariantInputs = NonNullable<Partial<ButtonSecondaryProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "secondary";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
