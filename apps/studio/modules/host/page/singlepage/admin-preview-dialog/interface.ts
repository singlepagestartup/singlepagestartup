export const variant = "admin-preview-dialog";

export interface IComponentVariantProps {
  variant?: "admin-preview-dialog";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-preview-dialog";
}

export interface IComponentPropsExtended extends IComponentProps {}
