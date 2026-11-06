export const variant = "button-default";

export interface CartButtonDefaultProps {
  variant?: "button-default";
  count: number;
  label: string;
  onClick?: () => void;
}

type IVariantInputs = NonNullable<Partial<CartButtonDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "button-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
