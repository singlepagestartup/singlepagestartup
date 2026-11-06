export const variant = "admin-v2-rich-editor";

export interface IComponentVariantProps {
  variant?: "admin-v2-rich-editor";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "admin-v2-rich-editor";
}

export interface IComponentPropsExtended extends IComponentProps {}
