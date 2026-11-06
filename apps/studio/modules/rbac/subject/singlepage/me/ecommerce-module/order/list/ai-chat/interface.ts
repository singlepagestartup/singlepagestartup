import type { IAIChatServicePageContent } from "../../../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "me-ecommerce-module-order-list-ai-chat";

export interface ISubjectOrderListProps {
  variant?: "me-ecommerce-module-order-list-ai-chat";
  showTokens?: boolean;
  copy?: IAIChatServicePageContent;
  empty?: boolean;
}

type IVariantInputs = NonNullable<ISubjectOrderListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-ecommerce-module-order-list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
