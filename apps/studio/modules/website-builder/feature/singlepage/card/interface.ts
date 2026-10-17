export const variant = "card";

export type FeatureCardProps = {
  icon: ModuleIcon;
  title: string;
  description: string;
};

type IVariantInputs = NonNullable<
  Partial<FeatureCardProps> & { variant?: "card" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ModuleIcon = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number }
>;
