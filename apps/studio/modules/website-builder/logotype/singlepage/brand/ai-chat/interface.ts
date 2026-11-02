export const variant = "brand-ai-chat";

export interface IComponentVariantProps {
  variant?: "brand-ai-chat";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "brand-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
