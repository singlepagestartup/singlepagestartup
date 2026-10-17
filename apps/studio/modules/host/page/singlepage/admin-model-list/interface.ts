export const variant = "admin-model-list";

export interface IComponentVariantProps {
  variant?: "admin-model-list";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-model-list";
}

export interface IComponentPropsExtended extends IComponentProps {}
