export const variant = "admin-dashboard";

export interface IComponentVariantProps {
  variant?: "admin-dashboard";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-dashboard";
}

export interface IComponentPropsExtended extends IComponentProps {}
