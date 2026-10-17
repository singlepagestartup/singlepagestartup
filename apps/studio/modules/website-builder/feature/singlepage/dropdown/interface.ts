export const variant = "dropdown";

export type FeatureDropdownProps = {
  question: string;
  answer: string;
  open: boolean;
};

type IVariantInputs = NonNullable<
  Partial<FeatureDropdownProps> & { variant?: "dropdown" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "dropdown";
}

export interface IComponentPropsExtended extends IComponentProps {}
