import type { SVGProps } from "react";

export const variant = "content-buttons-array-find-default";

export type ContentButtonsArrayFindDefaultProps = {
  label: string;
  integrations: {
    icon: import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").ForwardRefExoticComponent<
      Omit<IModuleIconProps, "ref"> &
        import("/Users/rogwild/code/singlepagestartup/sps-lite/node_modules/@types/react/index").RefAttributes<SVGSVGElement>
    >;
    label: string;
  }[];
};

type IVariantInputs = NonNullable<
  Partial<ContentButtonsArrayFindDefaultProps> & {
    variant?: "content-buttons-array-find-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "content-buttons-array-find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
