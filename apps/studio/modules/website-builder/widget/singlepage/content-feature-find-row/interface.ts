import type { SVGProps } from "react";
import type { ReactNode } from "react";

export const variant = "content-feature-find-row";

export interface ContentFeatureFindRowProps
  extends Partial<{
    eyebrow: string;
    title: string;
    description: string;
    contacts: {
      icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
        Omit<IModuleIconProps, "ref"> &
          import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
      >;
      label: string;
    }[];
  }> {
  variant?: "content-feature-find-row";
  contactForm?: ReactNode;
}

type IVariantInputs = NonNullable<ContentFeatureFindRowProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-feature-find-row";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
