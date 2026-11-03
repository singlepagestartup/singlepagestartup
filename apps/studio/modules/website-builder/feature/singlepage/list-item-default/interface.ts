export const variant = "list-item-default";

export type FeatureListItemDefaultProps = {
  icon: ModuleIcon;
  label: string;
  className: string;
};

type IVariantInputs = NonNullable<
  Partial<FeatureListItemDefaultProps> & { variant?: "list-item-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "list-item-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ModuleIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
