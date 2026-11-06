export const variant = "admin-model-edit";

export interface IComponentVariantProps {
  variant?: "admin-model-edit";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-model-edit";
}

export interface IComponentPropsExtended extends IComponentProps {}
