export const variant = "badge-default";

export type FeatureBadgeDefaultProps = { label: string };

type IVariantInputs = NonNullable<
  Partial<FeatureBadgeDefaultProps> & { variant?: "badge-default" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "badge-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
