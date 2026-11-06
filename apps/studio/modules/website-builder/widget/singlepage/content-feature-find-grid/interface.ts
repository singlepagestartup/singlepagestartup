import type { SVGProps } from "react";

export const variant = "content-feature-find-grid";

export interface ContentFeatureItem {
  icon: ModuleIcon;
  title: string;
  desc: string;
}

export type ContentFeatureFindGridProps = {
  eyebrow: string;
  title: string;
  features: {
    icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
      Omit<IModuleIconProps, "ref"> &
        import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
    >;
    title: string;
    desc: string;
  }[];
};

export type ModuleIcon = React.ComponentType<IModuleIconProps>;

type IVariantInputs = NonNullable<
  Partial<ContentFeatureFindGridProps> & {
    variant?: "content-feature-find-grid";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-feature-find-grid";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
