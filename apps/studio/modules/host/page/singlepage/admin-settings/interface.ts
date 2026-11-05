export const variant = "admin-settings";

export interface IComponentVariantProps {
  variant?: "admin-settings";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}
