export const variant = "ai-chat-help";

export interface IComponentVariantProps {
  variant?: "ai-chat-help";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "ai-chat-help";
}

export interface IComponentPropsExtended extends IComponentProps {}
