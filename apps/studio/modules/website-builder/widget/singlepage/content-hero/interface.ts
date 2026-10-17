import type { SVGProps } from "react";

export const variant = "content-hero";

export type ContentHeroProps = {
  feature: { label: string };
  title: string;
  description: string;
  buttons: (
    | {
        label: string;
        href: string;
        variant: "primary";
        icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
          Omit<IModuleIconProps, "ref"> &
            import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
        >;
      }
    | {
        label: string;
        href: string;
        variant: "secondary";
        icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
          Omit<IModuleIconProps, "ref"> &
            import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
        >;
      }
  )[];
  mediaSrc: string;
  mediaAlt: string;
  statusFeature: { label: string; value: string };
};

type IVariantInputs = NonNullable<
  Partial<ContentHeroProps> & { variant?: "content-hero" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-hero";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
