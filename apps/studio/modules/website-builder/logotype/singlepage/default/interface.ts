export const variant = "default";

export interface ILogotypeDefaultProps {
  variant?: "default";
  brand?: string;
  compact?: boolean;
}

type IVariantInputs = NonNullable<ILogotypeDefaultProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "default";
}

export interface IComponentPropsExtended extends IComponentProps {}
