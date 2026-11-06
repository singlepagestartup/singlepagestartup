export const variant = "social-module-chat-id-thread-id";

export interface IComponentVariantProps {
  variant?: "social-module-chat-id-thread-id";
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "social-module-chat-id-thread-id";
}

export interface IComponentPropsExtended extends IComponentProps {}
