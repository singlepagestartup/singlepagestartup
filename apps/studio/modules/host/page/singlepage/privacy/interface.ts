export const variant = "privacy";

export interface IComponentVariantProps {
  variant?: "privacy";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "privacy";
}

export interface IComponentPropsExtended extends IComponentProps {}
