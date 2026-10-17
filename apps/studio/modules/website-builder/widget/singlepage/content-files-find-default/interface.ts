import type { SVGProps } from "react";

export const variant = "content-files-find-default";

export type ContentFilesFindDefaultProps = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  mediaSrc: string;
  mediaAlt: string;
  features: {
    label: string;
    icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
      Omit<IModuleIconProps, "ref"> &
        import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
    >;
  }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentFilesFindDefaultProps> & {
    variant?: "content-files-find-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-files-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
