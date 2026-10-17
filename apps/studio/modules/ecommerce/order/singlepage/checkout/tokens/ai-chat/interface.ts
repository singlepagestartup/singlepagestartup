import type { IAIChatServicePageContent } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "checkout-tokens-ai-chat";

export interface ITokensProps {
  variant?: "checkout-tokens-ai-chat";
  copy?: IAIChatServicePageContent;
}

type IVariantInputs = NonNullable<ITokensProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "checkout-tokens-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
