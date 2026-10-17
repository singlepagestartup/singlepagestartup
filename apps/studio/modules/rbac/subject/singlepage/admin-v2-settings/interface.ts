export const variant = "admin-v2-settings";

export interface IComponentVariantProps {
  variant?: "admin-v2-settings";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}
