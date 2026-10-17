export const variant = "testimotional";

export type FeatureTestimotionalProps = {
  avatar: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  className: string;
};

type IVariantInputs = NonNullable<
  Partial<FeatureTestimotionalProps> & { variant?: "testimotional" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "testimotional";
}

export interface IComponentPropsExtended extends IComponentProps {}
