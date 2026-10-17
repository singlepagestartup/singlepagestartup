import type { ILoginProps } from "../../email-and-password/authentication-form/ai-chat";

export const variant = "me-authentication-select-method-ai-chat";

export interface ISelectMethodAiChatProps extends Omit<ILoginProps, "variant"> {
  variant?: typeof variant;
}

type IVariantInputs = NonNullable<ISelectMethodAiChatProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-select-method-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
