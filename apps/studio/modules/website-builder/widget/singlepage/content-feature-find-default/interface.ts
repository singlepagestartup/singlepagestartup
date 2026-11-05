import type { SVGProps } from "react";

export const variant = "content-feature-find-default";

export interface ContentFeatureFindDefaultProps {
  variant?: "content-feature-find-default";
  stats: StatItem[];
}

export interface StatItem {
  value: string;
  label: string;
  icon: ModuleIcon;
  description?: string;
}

export type ModuleIcon = React.ComponentType<IModuleIconProps>;

type IVariantInputs = NonNullable<Partial<ContentFeatureFindDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-feature-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
