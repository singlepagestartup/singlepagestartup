export const variant = "button-default";

export interface TagButtonDefaultProps {
  variant?: "button-default";
  label: string;
  href?: string;
}

type IVariantInputs = NonNullable<Partial<TagButtonDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "button-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
