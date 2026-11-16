import type { IAIChatServicePageContent } from "../../../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "me-ecommerce-module-order-list-ai-chat";

export type IRepeatState =
  "idle" | "confirmation" | "pending" | "success" | "error";

export interface IOrder {
  id: string;
  date: string;
  tokens: number;
  total: string;
  status: string;
  canRepeatPayment?: boolean;
}

export interface ISubjectOrderListProps {
  variant?: "me-ecommerce-module-order-list-ai-chat";
  showTokens?: boolean;
  copy?: IAIChatServicePageContent;
  empty?: boolean;
  repeatState?: IRepeatState;
  repeatOutcome?: "success" | "error";
}

type IVariantInputs = NonNullable<ISubjectOrderListProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-ecommerce-module-order-list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
