export const variant = "default";

export interface StartupWidgetDefaultProps {
  variant?: "default";
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

type IVariantInputs = NonNullable<StartupWidgetDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
