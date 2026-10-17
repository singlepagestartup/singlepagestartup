import type { SVGProps } from "react";

export const variant = "content-feature-find-card";

export type ContentFeatureFindCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  features: {
    icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
      Omit<IModuleIconProps, "ref"> &
        import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
    >;
    title: string;
    description: string;
  }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentFeatureFindCardProps> & {
    variant?: "content-feature-find-card";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-feature-find-card";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
