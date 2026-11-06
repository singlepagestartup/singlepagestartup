export const variant = "root";

export interface IComponentVariantProps {
  variant?: "root";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "root";
}

export interface IComponentPropsExtended extends IComponentProps {}
