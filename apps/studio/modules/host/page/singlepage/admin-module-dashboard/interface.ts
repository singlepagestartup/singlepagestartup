export const variant = "admin-module-dashboard";

export interface IComponentVariantProps {
  variant?: "admin-module-dashboard";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-module-dashboard";
}

export interface IComponentPropsExtended extends IComponentProps {}
