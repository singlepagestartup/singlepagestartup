export const variant = "terms";

export interface IComponentVariantProps {
  variant?: "terms";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "terms";
}

export interface IComponentPropsExtended extends IComponentProps {}
