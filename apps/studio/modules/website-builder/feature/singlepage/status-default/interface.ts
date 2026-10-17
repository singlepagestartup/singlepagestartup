export const variant = "status-default";

export type FeatureStatusDefaultProps = {
  icon: ModuleIcon;
  label: string;
  value: string;
  className: string;
};

type IVariantInputs = NonNullable<
  Partial<FeatureStatusDefaultProps> & { variant?: "status-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "status-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ModuleIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
